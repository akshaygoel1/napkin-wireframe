import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, MoreHorizontal, PencilLine, Trash2, X } from "lucide-react";
import { useStore } from "../store";
import type { Frame, NapkinElement } from "../types";
import { clamp, shellMetrics } from "../utils/geometry";
import { frameRegistry } from "../utils/canvasApi";
import { ElementView, type ResizeDir } from "./ElementView";
import { Glyph } from "./Sketch";

const PRESET_GLYPH: Record<string, string> = {
  phone: "mobile",
  tablet: "tablet",
  desktop: "desktop_windows",
  blank: "crop_square",
  custom: "crop_square",
};

export function FrameView({
  frame,
  zoom,
  onArtboardPointerDown,
  onElementPointerDown,
  onResizeStart,
  onStartEdit,
  onFrameDragStart,
  onArtboardDoubleClick,
}: {
  frame: Frame;
  zoom: number;
  onArtboardPointerDown: (e: React.PointerEvent, frame: Frame) => void;
  onElementPointerDown: (e: React.PointerEvent, frame: Frame | null, el: NapkinElement) => void;
  onResizeStart: (e: React.PointerEvent, frame: Frame | null, el: NapkinElement, dir: ResizeDir) => void;
  onStartEdit: (el: NapkinElement, frame: Frame | null) => void;
  onFrameDragStart: (e: React.PointerEvent, frame: Frame) => void;
  onArtboardDoubleClick: (e: React.MouseEvent, frame: Frame) => void;
}) {
  const blockRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const selectedFrameId = useStore((s) => s.selectedFrameId);
  const selection = useStore((s) => s.selection);
  const updateFrame = useStore((s) => s.updateFrame);
  const deleteFrame = useStore((s) => s.deleteFrame);
  const duplicateFrame = useStore((s) => s.duplicateFrame);
  const setExportOpen = useStore((s) => s.setExportOpen);
  const m = shellMetrics(frame);
  const blockLeft = frame.x - m.padX;
  const blockTop = frame.y - m.padTop - m.labelH;
  const blockWidth = frame.w + m.padX * 2;

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(frame.name);
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const selected = selectedFrameId === frame.id;
  const hasElementSelection = selection.length > 0;

  useLayoutEffect(() => {
    if (!blockRef.current || !artboardRef.current) return;
    frameRegistry.set(frame.id, {
      block: blockRef.current,
      artboard: artboardRef.current,
      shell: shellRef.current,
    });
    return () => {
      frameRegistry.delete(frame.id);
    };
  }, [frame.id]);

  useEffect(() => {
    if (renaming) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [renaming]);

  // Place the portaled frame menu at the requested point, clamped to the window.
  useLayoutEffect(() => {
    if (!menuAt) {
      setMenuPos(null);
      return;
    }
    const rect = menuRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPos({
      left: clamp(menuAt.x, 8, Math.max(8, window.innerWidth - rect.width - 8)),
      top: clamp(menuAt.y, 8, Math.max(8, window.innerHeight - rect.height - 8)),
    });
  }, [menuAt]);

  useEffect(() => {
    if (!menuAt) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !menuButtonRef.current?.contains(e.target as Node)) {
        setMenuAt(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAt(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuAt]);

  const commitName = () => {
    const name = nameDraft.trim();
    if (name && name !== frame.name) updateFrame(frame.id, { name });
    setRenaming(false);
  };

  const openMenuAt = (x: number, y: number) => {
    useStore.getState().selectFrame(frame.id);
    setMenuAt({ x, y });
  };

  const isPhone = frame.preset === "phone" && frame.shell;
  const isTablet = frame.preset === "tablet" && frame.shell;
  const isDesktop = frame.preset === "desktop" && frame.shell;
  const shellClass = frame.shell ? `has-shell shell-${frame.preset}` : "no-shell";

  const menu = menuAt
    ? createPortal(
        <div
          className="frame-menu frame-menu-portal"
          ref={menuRef}
          style={{
            position: "fixed",
            left: menuPos?.left ?? menuAt.x,
            top: menuPos?.top ?? menuAt.y,
            visibility: menuPos ? "visible" : "hidden",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setNameDraft(frame.name);
              setRenaming(true);
              setMenuAt(null);
            }}
          >
            <PencilLine size={13} /> Rename
          </button>
          <button
            onClick={() => {
              duplicateFrame(frame.id);
              setMenuAt(null);
            }}
          >
            <Copy size={13} /> Duplicate
          </button>
          <button
            onClick={() => {
              setExportOpen(true, [frame.id]);
              setMenuAt(null);
            }}
          >
            <Download size={13} /> Export PNG
          </button>
          <button
            className="danger"
            onClick={() => {
              deleteFrame(frame.id);
              setMenuAt(null);
            }}
          >
            <Trash2 size={13} /> Delete frame
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      className={`frame-block ${selected ? "frame-is-selected" : ""}`}
      style={{ left: blockLeft, top: blockTop, width: blockWidth }}
      ref={blockRef}
      data-frame-id={frame.id}
    >
      <div
        className={`frame-label ${selected ? "selected" : ""}`}
        onPointerDown={(e) => {
          if (renaming) return;
          e.stopPropagation();
          onFrameDragStart(e, frame);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openMenuAt(e.clientX, e.clientY);
        }}
      >
        <span className="frame-glyph">
          <Glyph name={PRESET_GLYPH[frame.preset] ?? "crop_square"} size={13} color="currentColor" />
        </span>
        {renaming ? (
          <input
            ref={nameRef}
            className="frame-name-input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setNameDraft(frame.name);
                setRenaming(false);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="frame-name"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setNameDraft(frame.name);
              setRenaming(true);
            }}
          >
            {frame.name}
          </span>
        )}
        <span className="frame-size">
          {frame.w} × {frame.h}
        </span>
        <div className="frame-actions" onPointerDown={(e) => e.stopPropagation()}>
          <button
            className="frame-action"
            title="Export this frame"
            onClick={() => setExportOpen(true, [frame.id])}
          >
            <Download size={13} />
          </button>
          <button
            className={`frame-action ${menuAt ? "active" : ""}`}
            title="Frame menu"
            ref={menuButtonRef}
            onClick={() => {
              if (menuAt) {
                setMenuAt(null);
                return;
              }
              const rect = menuButtonRef.current?.getBoundingClientRect();
              openMenuAt(rect?.left ?? 0, (rect?.bottom ?? 0) + 4);
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        {selected && !hasElementSelection && <span className="frame-selected-tag">selected</span>}
      </div>

      <div
        className={`frame-shell ${shellClass}`}
        ref={shellRef}
        style={{
          borderRadius: frame.shell ? undefined : 4,
        }}
      >
        {isDesktop && (
          <div className="browser-chrome" style={{ width: "100%" }}>
            <span className="browser-dot" />
            <span className="browser-dot" />
            <span className="browser-dot" />
            <div className="browser-address">
              <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden>
                <rect x="1" y="4.5" width="7" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M2.6 4.5V3.3a1.9 1.9 0 0 1 3.8 0v1.2" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span>tidepool.app / {frame.name.toLowerCase().replace(/\s+/g, "-")}</span>
            </div>
            <span className="browser-plus">+</span>
            <X size={12} className="browser-x" />
          </div>
        )}

        <div
          className={`artboard ${selected && !hasElementSelection ? "is-selected" : ""}`}
          ref={artboardRef}
          style={{ width: frame.w, height: frame.h }}
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget) return;
            onArtboardPointerDown(e, frame);
          }}
          onDoubleClick={(e) => {
            if (e.target !== e.currentTarget) return;
            onArtboardDoubleClick(e, frame);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openMenuAt(e.clientX, e.clientY);
          }}
        >
          {(isPhone || isTablet) && (
            <div className="status-bar" style={{ height: isPhone ? 38 : 30 }}>
              <span className="status-time">{isPhone ? "9:41" : "9:41"}</span>
              <div className="status-right">
                <span className="signal-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <Glyph name="wifi" size={isPhone ? 14 : 12} />
                <Glyph name="battery_full" size={isPhone ? 18 : 15} />
              </div>
            </div>
          )}
          {isPhone && (
            <div className="phone-notch">
              <span className="notch-camera" />
            </div>
          )}
          {isTablet && <div className="tablet-camera" />}

          {frame.elements.map((el) => (
            <ElementView
              key={el.id}
              frame={frame}
              el={el}
              zoom={zoom}
              onPointerDown={onElementPointerDown}
              onResizeStart={onResizeStart}
              onStartEdit={onStartEdit}
            />
          ))}

          {selected && !hasElementSelection && <div className="artboard-selected-ring" />}
        </div>

        {isPhone && (
          <>
            <span className="device-btn device-btn-1" />
            <span className="device-btn device-btn-2" />
            <span className="device-btn device-btn-3" />
          </>
        )}
      </div>

      {menu}
    </div>
  );
}
