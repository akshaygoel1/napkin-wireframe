import { useEffect } from "react";
import { Canvas } from "./components/Canvas";
import { SketchProvider } from "./components/Sketch";
import { useStore } from "./store";
import { AboutDialog } from "./ui/AboutDialog";
import { BottomBar } from "./ui/BottomBar";
import { ComponentLibrary } from "./ui/ComponentLibrary";
import { CropDialog } from "./ui/CropDialog";
import { ElementContextMenu } from "./ui/ElementContextMenu";
import { ExportDialog } from "./ui/ExportDialog";
import { FramesFlyout, ImageFlyout, MarkupFlyout } from "./ui/Flyouts";
import { IconPicker } from "./ui/IconPicker";
import { Inspector } from "./ui/Inspector";
import { NewFrameDialog } from "./ui/NewFrameDialog";
import { QuickAdd } from "./ui/QuickAdd";
import { ShortcutsDialog } from "./ui/ShortcutsDialog";
import { Toast } from "./ui/Toast";
import { Toolbar } from "./ui/Toolbar";
import { TopBar } from "./ui/TopBar";
import { canvasApi } from "./utils/canvasApi";
import { copyFramePng, loadExportOptions } from "./utils/exportFrames";

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useStore.getState();
      const target = e.target as HTMLElement | null;
      const typing = isTypingTarget(target);

      // Quick-add owns its own keyboard while it is open.
      if (state.paletteOpen) {
        if (e.key === "Escape" && !typing) state.setPaletteOpen(false);
        return;
      }

      const dialogOpen = state.exportOpen || state.shortcutsOpen || state.newFrameOpen || state.aboutOpen || !!state.cropId;
      if (dialogOpen) return;
      if (typing) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod) {
        const key = e.key.toLowerCase();
        if (key === "z") {
          e.preventDefault();
          if (e.shiftKey) state.redo();
          else state.undo();
          return;
        }
        if (key === "d") {
          e.preventDefault();
          if (state.selection.length) state.duplicateSelection();
          return;
        }
        if (key === "c") {
          if (e.shiftKey) {
            e.preventDefault();
            const frame =
              state.project.frames.find((f) => f.elements.some((el) => state.selection.includes(el.id))) ??
              state.project.frames.find((f) => f.id === state.selectedFrameId) ??
              state.project.frames[0];
            if (!frame) {
              state.showToast("Add a frame first, then copy it");
              return;
            }
            void copyFramePng(frame, loadExportOptions())
              .then(() => state.showToast("Frame copied to clipboard as PNG"))
              .catch(() => state.showToast("Clipboard copy was blocked. Try Export instead."));
            return;
          }
          e.preventDefault();
          state.copySelection();
          return;
        }
        if (key === "v") {
          e.preventDefault();
          state.pasteElements();
          return;
        }
        if (key === "a") {
          e.preventDefault();
          state.selectAllInFrame();
          return;
        }
        if (key === "e" && e.shiftKey) {
          e.preventDefault();
          const selectedFrame = state.project.frames.find((f) => f.id === state.selectedFrameId);
          state.setExportOpen(true, selectedFrame ? [selectedFrame.id] : null);
          return;
        }
        if (key === "=" || key === "+") {
          e.preventDefault();
          canvasApi.zoomBy(1.18);
          return;
        }
        if (key === "-") {
          e.preventDefault();
          canvasApi.zoomBy(1 / 1.18);
          return;
        }
        if (key === "0") {
          e.preventDefault();
          const current = state.view.zoom;
          canvasApi.zoomBy(1 / current);
          return;
        }
        return;
      }

      if (e.altKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (state.contextMenu) {
          state.setContextMenu(null);
          return;
        }
        if (state.armed) {
          state.setArmed(null);
          return;
        }
        if (state.flyout) {
          state.setFlyout(null);
          return;
        }
        if (state.selection.length) {
          state.selectElements([]);
          return;
        }
        if (state.selectedFrameId) {
          state.selectFrame(null);
          return;
        }
        return;
      }

      if (e.shiftKey && e.key === "1") {
        e.preventDefault();
        canvasApi.fitAll();
        return;
      }
      if (e.shiftKey && e.key === "2") {
        e.preventDefault();
        const elFrame = state.project.frames.find((f) => f.elements.some((el) => state.selection.includes(el.id)));
        const frame = elFrame ?? state.project.frames.find((f) => f.id === state.selectedFrameId);
        if (frame) canvasApi.centerOnFrame(frame.id);
        else canvasApi.fitAll();
        return;
      }

      switch (e.key) {
        case "?":
          e.preventDefault();
          state.setShortcutsOpen(true);
          return;
        case "/":
        case "+":
          e.preventDefault();
          state.setPaletteOpen(true);
          return;
        case "c":
        case "C":
          e.preventDefault();
          state.setFlyout("components");
          return;
        case "f":
        case "F":
          e.preventDefault();
          state.setNewFrameOpen(true);
          return;
        case "i":
        case "I":
          e.preventDefault();
          state.setFlyout("icons");
          return;
        case "t":
        case "T":
          e.preventDefault();
          state.setArmed({ type: "text" });
          return;
        case "v":
        case "V":
          e.preventDefault();
          state.setTool("select");
          return;
        case "h":
        case "H":
          e.preventDefault();
          state.setTool("hand");
          return;
        case "Backspace":
        case "Delete":
          if (state.selection.length) {
            e.preventDefault();
            state.removeElements(state.selection);
          }
          return;
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
          if (state.selection.length) {
            const step = e.shiftKey ? 8 : 1;
            const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
            const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
            state.nudgeSelection(dx, dy);
          } else if (state.selectedFrameId) {
            const frame = state.project.frames.find((f) => f.id === state.selectedFrameId);
            if (frame) {
              const step = e.shiftKey ? 8 : 1;
              const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
              const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
              state.updateFrame(frame.id, { x: frame.x + dx, y: frame.y + dy });
            }
          }
          return;
        case "[":
          if (state.selection.length) {
            e.preventDefault();
            state.reorder("back");
          }
          return;
        case "]":
          if (state.selection.length) {
            e.preventDefault();
            state.reorder("front");
          }
          return;
        default:
          break;
      }

      // Type-to-add: a printable key opens quick-add with that seed.
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        state.setPaletteOpen(true, e.key);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function useWelcomeToast() {
  useEffect(() => {
    try {
      if (localStorage.getItem("napkin.welcomed.v1")) return;
      localStorage.setItem("napkin.welcomed.v1", "1");
    } catch {
      return;
    }
    const t = setTimeout(() => {
      const state = useStore.getState();
      state.showToast("Press / anywhere to add anything");
    }, 1400);
    return () => clearTimeout(t);
  }, []);
}

export function App() {
  const flyout = useStore((s) => s.flyout);
  const paletteOpen = useStore((s) => s.paletteOpen);
  const exportOpen = useStore((s) => s.exportOpen);
  const shortcutsOpen = useStore((s) => s.shortcutsOpen);
  const newFrameOpen = useStore((s) => s.newFrameOpen);
  const aboutOpen = useStore((s) => s.aboutOpen);
  const sketchiness = useStore((s) => s.sketchiness);
  const cleanExport = useStore((s) => s.cleanExport);

  useGlobalShortcuts();
  useWelcomeToast();

  return (
    <div className="app-shell">
      <TopBar />
      <main className="workspace">
        <SketchProvider roughness={sketchiness} clean={cleanExport}>
          <Canvas />
        </SketchProvider>
        <Toolbar />
        {flyout === "components" && <ComponentLibrary />}
        {flyout === "icons" && <IconPicker />}
        {flyout === "images" && <ImageFlyout />}
        {flyout === "markup" && <MarkupFlyout />}
        {flyout === "frames" && <FramesFlyout />}
        <Inspector />
        <BottomBar />
      </main>

      {paletteOpen && <QuickAdd />}
      {exportOpen && <ExportDialog />}
      {shortcutsOpen && <ShortcutsDialog />}
      {newFrameOpen && <NewFrameDialog />}
      {aboutOpen && <AboutDialog />}
      <CropDialog />
      <ElementContextMenu />
      <Toast />
    </div>
  );
}
