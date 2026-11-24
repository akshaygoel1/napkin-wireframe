import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Crop,
  Layers,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { SPECS } from "../data/components";
import { useStore } from "../store";
import { supportsColor } from "../utils/color";
import { ColorField } from "./ColorField";

const SIZE_PRESETS = [
  { label: "S", factor: 0.78, title: "Small" },
  { label: "M", factor: 1, title: "Medium" },
  { label: "L", factor: 1.3, title: "Large" },
] as const;

export function ElementContextMenu() {
  const menu = useStore((s) => s.contextMenu);
  const selection = useStore((s) => s.selection);
  const project = useStore((s) => s.project);
  const setContextMenu = useStore((s) => s.setContextMenu);
  const setCropId = useStore((s) => s.setCropId);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const selected = project.frames.flatMap((f) => f.elements).filter((el) => selection.includes(el.id));
  const colorEligible = selected.filter((el) => supportsColor(el.type));
  const single = selected.length === 1 ? selected[0] : null;
  const title = single ? SPECS[single.type]?.name ?? single.type : `${selected.length} elements`;

  useLayoutEffect(() => {
    if (!menu) return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(menu.x, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(menu.y, window.innerHeight - rect.height - 8)),
    });
  }, [menu, selected.length, colorEligible.length]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setContextMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    const onViewportChange = () => setContextMenu(null);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [menu, setContextMenu]);

  useEffect(() => {
    if (menu && selected.length === 0) setContextMenu(null);
  }, [menu, selected.length, setContextMenu]);

  if (!menu || selected.length === 0) return null;

  const close = () => setContextMenu(null);

  const applyColor = (color?: string) => {
    if (!colorEligible.length) return;
    const state = useStore.getState();
    state.snapshot();
    colorEligible.forEach((el) => state.updateProps(el.id, { color }, false));
  };

  const applySize = (factor: number) => {
    const state = useStore.getState();
    state.snapshot();
    selected.forEach((el) => {
      const spec = SPECS[el.type];
      if (!spec) return;
      const frame = state.project.frames.find((f) => f.elements.some((x) => x.id === el.id));
      const w = Math.max(8, Math.round(spec.defaultW * factor));
      const h = Math.max(8, Math.round(spec.defaultH * factor));
      let x = Math.round(el.x + el.w / 2 - w / 2);
      let y = Math.round(el.y + el.h / 2 - h / 2);
      if (frame) {
        x = Math.max(0, Math.min(x, frame.w - w));
        y = Math.max(0, Math.min(y, frame.h - h));
      }
      state.updateElement(el.id, { x, y, w, h }, false);
    });
    close();
  };

  const layer = (direction: "front" | "up" | "down" | "back") => {
    useStore.getState().reorder(direction);
    close();
  };

  return (
    <div
      ref={ref}
      className="el-menu"
      style={{ left: pos.left, top: pos.top }}
      role="menu"
      aria-label="Element actions"
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="el-menu-head">
        <b>{title}</b>
        <span>{selected.length > 1 ? `${selected.length} selected` : "Right-click actions"}</span>
      </div>

      {colorEligible.length > 0 && (
        <div className="el-menu-section">
          <span className="el-menu-label">Color</span>
          <ColorField compact value={colorEligible[0].props.color} onChange={applyColor} />
        </div>
      )}

      <div className="el-menu-section">
        <span className="el-menu-label">Size</span>
        <div className="el-menu-sizes">
          {SIZE_PRESETS.map((preset) => (
            <button key={preset.label} title={preset.title} onClick={() => applySize(preset.factor)}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="el-menu-section">
        <span className="el-menu-label">Layer</span>
        <div className="el-menu-grid">
          <button onClick={() => layer("front")} title="Bring to front">
            <ArrowUpToLine size={14} /> Front
          </button>
          <button onClick={() => layer("up")} title="Bring forward">
            <Layers size={14} /> Forward
          </button>
          <button onClick={() => layer("down")} title="Send backward">
            <Layers size={14} /> Backward
          </button>
          <button onClick={() => layer("back")} title="Send to back">
            <ArrowDownToLine size={14} /> Back
          </button>
        </div>
      </div>

      <div className="el-menu-section el-menu-actions">
        {single?.type === "image" && single.props.src && (
          <button
            onClick={() => {
              setCropId(single.id);
              close();
            }}
          >
            <Crop size={14} /> Crop image
          </button>
        )}
        <button
          onClick={() => {
            useStore.getState().duplicateSelection();
            close();
          }}
        >
          <Copy size={14} /> Duplicate
        </button>
        <button
          onClick={() => {
            useStore.getState().reSeedSelection();
            close();
          }}
        >
          <RefreshCw size={14} /> Re-sketch
        </button>
        <button
          className="danger"
          onClick={() => {
            useStore.getState().removeElements(selection);
            close();
          }}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
