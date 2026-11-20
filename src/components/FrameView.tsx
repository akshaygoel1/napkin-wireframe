import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Copy, Download, MoreHorizontal, PencilLine, Trash2, X } from "lucide-react";
import { useStore } from "../store";
import type { Frame, NapkinElement } from "../types";
import { shellMetrics } from "../utils/geometry";
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
  onElementPointerDown: (e: React.PointerEvent, frame: Frame, el: NapkinElement) => void;
  onResizeStart: (e: React.PointerEvent, frame: Frame, el: NapkinElement, dir: ResizeDir) => void;
  onStartEdit: (frame: Frame, el: NapkinElement) => void;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (!actionsRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const commitName = () => {
    const name = nameDraft.trim();
    if (name && name !== frame.name) updateFrame(frame.id, { name });
    setRenaming(false);
  };

  const isPhone = frame.preset === "phone" && frame.shell;
  const isTablet = frame.preset === "tablet" && frame.shell;
  const isDesktop = frame.preset === "desktop" && frame.shell;
  const shellClass = frame.shell ? `has-shell shell-${frame.preset}` : "no-shell";

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
          useStore.getState().selectFrame(frame.id);
          setMenuOpen(true);
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
        <div className="frame-actions" ref={actionsRef} onPointerDown={(e) => e.stopPropagation()}>
          <button
            className="frame-action"
            title="Export this frame"
            onClick={() => setExportOpen(true, [frame.id])}
          >
            <Download size={13} />
          </button>
          <button
            className={`frame-action ${menuOpen ? "active" : ""}`}
            title="Frame menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="frame-menu" onPointerDown={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setNameDraft(frame.name);
                  setRenaming(true);
                  setMenuOpen(false);
                }}
              >
                <PencilLine size={13} /> Rename
              </button>
              <button
                onClick={() => {
                  duplicateFrame(frame.id);
                  setMenuOpen(false);
                }}
              >
                <Copy size={13} /> Duplicate
              </button>
              <button
                onClick={() => {
                  setExportOpen(true, [frame.id]);
                  setMenuOpen(false);
                }}
              >
                <Download size={13} /> Export PNG
              </button>
              <button
                className="danger"
                onClick={() => {
                  deleteFrame(frame.id);
                  setMenuOpen(false);
                }}
              >
                <Trash2 size={13} /> Delete frame
              </button>
            </div>
          )}
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
            useStore.getState().selectFrame(frame.id);
            setMenuOpen(true);
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
    </div>
  );
}
