import { Copy, Pencil, Trash2 } from "lucide-react";
import { SPECS } from "../data/components";
import { useStore } from "../store";
import type { Frame, NapkinElement } from "../types";
import { Wireframe } from "./Wireframe";

export type ResizeDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const HANDLES: { dir: ResizeDir; style: Record<string, string> }[] = [
  { dir: "nw", style: { left: "calc(-4.5px * var(--inv))", top: "calc(-4.5px * var(--inv))" } },
  { dir: "n", style: { left: "50%", top: "calc(-4.5px * var(--inv))", transform: "translateX(-50%)" } },
  { dir: "ne", style: { right: "calc(-4.5px * var(--inv))", top: "calc(-4.5px * var(--inv))" } },
  { dir: "e", style: { right: "calc(-4.5px * var(--inv))", top: "50%", transform: "translateY(-50%)" } },
  { dir: "se", style: { right: "calc(-4.5px * var(--inv))", bottom: "calc(-4.5px * var(--inv))" } },
  { dir: "s", style: { left: "50%", bottom: "calc(-4.5px * var(--inv))", transform: "translateX(-50%)" } },
  { dir: "sw", style: { left: "calc(-4.5px * var(--inv))", bottom: "calc(-4.5px * var(--inv))" } },
  { dir: "w", style: { left: "calc(-4.5px * var(--inv))", top: "50%", transform: "translateY(-50%)" } },
];

export function ElementView({
  frame,
  el,
  zoom,
  onPointerDown,
  onResizeStart,
  onStartEdit,
}: {
  frame: Frame;
  el: NapkinElement;
  zoom: number;
  onPointerDown: (e: React.PointerEvent, frame: Frame, el: NapkinElement) => void;
  onResizeStart: (e: React.PointerEvent, frame: Frame, el: NapkinElement, dir: ResizeDir) => void;
  onStartEdit: (frame: Frame, el: NapkinElement) => void;
}) {
  const selected = useStore((s) => s.selection.includes(el.id));
  const single = useStore((s) => s.selection.length === 1 && s.selection[0] === el.id);
  const armed = useStore((s) => !!s.armed);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const removeElements = useStore((s) => s.removeElements);
  const spec = SPECS[el.type];
  const markup = ["sticky", "callout", "arrow", "number", "hotspot"].includes(el.type);
  const inv = 1 / Math.max(0.1, zoom);

  return (
    <div
      className={`el ${selected ? "is-selected" : ""} ${markup ? "markup-el" : ""} ${el.hidden ? "is-hidden" : ""}`}
      data-el-id={el.id}
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        zIndex: 2,
        ["--inv" as string]: inv,
        cursor: armed ? "crosshair" : "move",
      }}
      onPointerDown={(e) => onPointerDown(e, frame, el)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const state = useStore.getState();
        if (!state.selection.includes(el.id)) state.selectElements([el.id], frame.id);
        state.setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit(frame, el);
      }}
    >
      <div className="wf-root" style={{ position: "absolute", inset: 0 }}>
        <Wireframe type={el.type} w={el.w} h={el.h} p={el.props} seed={el.seed} />
      </div>

      <div className="hover-ui" />

      {selected && (
        <>
          <div className="sel-outline" />
          {single && (
            <>
              <div className="sel-chip">
                {spec?.name ?? el.type}
              </div>
              <div className="sel-toolbar" onPointerDown={(e) => e.stopPropagation()}>
                <button
                  className="sel-tool"
                  title="Edit label (double-click)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(frame, el);
                  }}
                >
                  <Pencil />
                </button>
                <button
                  className="sel-tool"
                  title="Duplicate (⌘D)"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateSelection();
                  }}
                >
                  <Copy />
                </button>
                <button
                  className="sel-tool danger"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElements([el.id]);
                  }}
                >
                  <Trash2 />
                </button>
              </div>
              {HANDLES.map((hnd) => (
                <button
                  key={hnd.dir}
                  className={`sel-handle handle-${hnd.dir}`}
                  style={hnd.style}
                  aria-label={`Resize ${hnd.dir}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onResizeStart(e, frame, el, hnd.dir);
                  }}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
