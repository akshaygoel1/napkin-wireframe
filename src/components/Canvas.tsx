import { useCallback, useEffect, useRef, useState } from "react";
import { FRAME_PRESETS } from "../data/starter";
import { SPECS } from "../data/components";
import { useStore } from "../store";
import type { Frame, NapkinElement, Point } from "../types";
import { canvasApi, frameRegistry } from "../utils/canvasApi";
import { clamp, frameBlockRect, projectBounds, snap } from "../utils/geometry";
import { imageFilesFromDataTransfer, importImageFiles } from "../utils/images";
import { FrameView } from "./FrameView";
import type { ResizeDir } from "./ElementView";

type Interaction =
  | { kind: "pan"; startX: number; startY: number; tx: number; ty: number }
  | {
      kind: "drag-el";
      startX: number;
      startY: number;
      items: { id: string; frameId: string; x: number; y: number }[];
      snapshot: unknown;
      moved: boolean;
    }
  | {
      kind: "resize";
      dir: ResizeDir;
      startX: number;
      startY: number;
      elId: string;
      frameId: string;
      startRect: { x: number; y: number; w: number; h: number };
      snapshot: unknown;
      moved: boolean;
    }
  | {
      kind: "drag-frame";
      frameId: string;
      startX: number;
      startY: number;
      x: number;
      y: number;
      snapshot: unknown;
      moved: boolean;
    }
  | { kind: "marquee"; start: Point; current: Point; additive: boolean }
  | {
      kind: "armed";
      frameId: string;
      start: Point;
      current: Point;
      w: number;
      h: number;
      dragged: boolean;
    };

interface Editing {
  frameId: string;
  elId: string;
  value: string;
  left: number;
  top: number;
  width: number;
}

function InlineEditor({
  editing,
  onCommit,
  onCancel,
}: {
  editing: Editing;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(editing.value);
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const commit = () => {
    if (done.current) return;
    done.current = true;
    onCommit(value);
  };
  return (
    <div className="inline-editor" style={{ left: editing.left, top: editing.top, width: editing.width }}>
      <div className="inline-editor-head">
        <span>Edit label</span>
        <span className="inline-editor-hint">↵ done · esc cancel</span>
      </div>
      <input
        ref={ref}
        className="inline-editor-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            commit();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            done.current = true;
            onCancel();
          }
        }}
      />
    </div>
  );
}

export function Canvas() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frames = useStore((s) => s.project.frames);
  const projectId = useStore((s) => s.project.id);
  const view = useStore((s) => s.view);
  const grid = useStore((s) => s.grid);
  const tool = useStore((s) => s.tool);
  const armed = useStore((s) => s.armed);
  const setView = useStore((s) => s.setView);
  const setArmed = useStore((s) => s.setArmed);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const setTool = useStore((s) => s.setTool);

  const [interactionBusy, setInteractionBusy] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [ghost, setGhost] = useState<{ frameId: string; x: number; y: number; w: number; h: number } | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const interaction = useRef<Interaction | null>(null);
  const lastPointer = useRef<Point | null>(null);
  const didInitialFit = useRef(false);

  const zoom = view.zoom;

  const pointerToWorld = useCallback((clientX: number, clientY: number): Point | null => {
    const vp = viewportRef.current;
    if (!vp) return null;
    const rect = vp.getBoundingClientRect();
    const v = useStore.getState().view;
    return {
      x: (clientX - rect.left - v.tx) / v.zoom,
      y: (clientY - rect.top - v.ty) / v.zoom,
    };
  }, []);

  const fitAll = useCallback(() => {
    const vp = viewportRef.current;
    const state = useStore.getState();
    if (!vp) return;
    const bounds = projectBounds(state.project.frames);
    if (!bounds.w || !bounds.h) {
      setView({ zoom: 0.8, tx: vp.clientWidth / 2 - 320, ty: vp.clientHeight / 2 - 240 });
      return;
    }
    const padX = 140;
    const padY = 110;
    const z = clamp(
      Math.min((vp.clientWidth - padX * 2) / bounds.w, (vp.clientHeight - padY * 2) / bounds.h),
      0.1,
      1.25,
    );
    setView({
      zoom: z,
      tx: (vp.clientWidth - bounds.w * z) / 2 - bounds.x * z,
      ty: (vp.clientHeight - bounds.h * z) / 2 - bounds.y * z,
    });
  }, [setView]);

  const centerOnFrame = useCallback(
    (id: string) => {
      const doCenter = () => {
        const vp = viewportRef.current;
        const frame = useStore.getState().project.frames.find((f) => f.id === id);
        if (!vp || !frame) return;
        const r = frameBlockRect(frame);
        const z = clamp(Math.min((vp.clientWidth - 220) / r.w, (vp.clientHeight - 170) / r.h), 0.2, 0.9);
        setView({
          zoom: z,
          tx: vp.clientWidth / 2 - (r.x + r.w / 2) * z,
          ty: vp.clientHeight / 2 - (r.y + r.h / 2) * z,
        });
      };
      requestAnimationFrame(() => setTimeout(doCenter, 20));
    },
    [setView],
  );

  const zoomBy = useCallback(
    (factor: number, anchor?: Point) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const v = useStore.getState().view;
      const px = anchor?.x ?? vp.clientWidth / 2;
      const py = anchor?.y ?? vp.clientHeight / 2;
      const next = clamp(v.zoom * factor, 0.1, 4);
      if (Math.abs(next - v.zoom) < 0.0001) return;
      setView({
        zoom: next,
        tx: px - (px - v.tx) * (next / v.zoom),
        ty: py - (py - v.ty) * (next / v.zoom),
      });
    },
    [setView],
  );

  // Register the imperative API used by menus, popovers and shortcuts
  useEffect(() => {
    canvasApi.viewport = viewportRef.current;
    canvasApi.fitAll = fitAll;
    canvasApi.zoomBy = zoomBy;
    canvasApi.centerOnFrame = centerOnFrame;
    canvasApi.revealFrame = centerOnFrame;
    canvasApi.clientToWorld = pointerToWorld;
    canvasApi.pointerInsert = () => {
      const vp = viewportRef.current;
      const p = lastPointer.current;
      if (!vp || !p) return null;
      const rect = vp.getBoundingClientRect();
      const v = useStore.getState().view;
      const wx = (p.x - rect.left - v.tx) / v.zoom;
      const wy = (p.y - rect.top - v.ty) / v.zoom;
      const frame = useStore
        .getState()
        .project.frames.find((f) => wx >= f.x && wx <= f.x + f.w && wy >= f.y && wy <= f.y + f.h);
      if (!frame) return null;
      return { frameId: frame.id, x: wx - frame.x, y: wy - frame.y };
    };
    return () => {
      canvasApi.viewport = null;
    };
  }, [fitAll, zoomBy, centerOnFrame, pointerToWorld]);

  useEffect(() => {
    if (didInitialFit.current) return;
    didInitialFit.current = true;
    const t = setTimeout(fitAll, 80);
    return () => clearTimeout(t);
  }, [fitAll]);

  const prevProject = useRef(projectId);
  useEffect(() => {
    if (prevProject.current === projectId) return;
    prevProject.current = projectId;
    const t = setTimeout(fitAll, 80);
    return () => clearTimeout(t);
  }, [projectId, fitAll]);

  // Wheel: pan with trackpads, zoom with ctrl/cmd or pinch
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        const v = useStore.getState().view;
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const next = clamp(v.zoom * Math.exp(-e.deltaY * 0.0022), 0.1, 4);
        setView({
          zoom: next,
          tx: px - (px - v.tx) * (next / v.zoom),
          ty: py - (py - v.ty) * (next / v.zoom),
        });
      } else {
        const v = useStore.getState().view;
        setView({ tx: v.tx - e.deltaX, ty: v.ty - e.deltaY });
      }
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [setView]);

  // Space-to-pan
  useEffect(() => {
    const isForm = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isForm(e.target)) {
        e.preventDefault();
        setSpaceDown(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };
    const blur = () => setSpaceDown(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const startPan = (e: React.PointerEvent) => {
    const v = useStore.getState().view;
    interaction.current = { kind: "pan", startX: e.clientX, startY: e.clientY, tx: v.tx, ty: v.ty };
    setInteractionBusy(true);
  };

  const startArmedDraw = (e: React.PointerEvent, frame: Frame) => {
    const state = useStore.getState();
    if (!state.armed) return;
    const world = pointerToWorld(e.clientX, e.clientY);
    if (!world) return;
    const spec = SPECS[state.armed.type];
    if (!spec) return;
    const lx = world.x - frame.x;
    const ly = world.y - frame.y;
    const defW = Math.min(state.armed.w ?? spec.defaultW, frame.w - 32);
    const defH = Math.min(state.armed.h ?? spec.defaultH, frame.h - 32);
    interaction.current = {
      kind: "armed",
      frameId: frame.id,
      start: { x: lx, y: ly },
      current: { x: lx, y: ly },
      w: defW,
      h: defH,
      dragged: false,
    };
    setGhost({
      frameId: frame.id,
      x: clamp(lx - defW / 2, 8, frame.w - defW - 8),
      y: clamp(ly - defH / 2, 8, frame.h - defH - 8),
      w: defW,
      h: defH,
    });
    setInteractionBusy(true);
  };

  const onElementPointerDown = (e: React.PointerEvent, frame: Frame, el: NapkinElement) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const state = useStore.getState();
    if (spaceDown || tool === "hand") {
      startPan(e);
      return;
    }
    if (state.armed) {
      startArmedDraw(e, frame);
      return;
    }
    let selection = state.selection;
    if (e.shiftKey) {
      if (selection.includes(el.id)) {
        selection = selection.filter((id) => id !== el.id);
        state.selectElements(selection, frame.id);
        return;
      }
      selection = [...selection, el.id];
    } else if (!selection.includes(el.id)) {
      selection = [el.id];
    }
    state.selectElements(selection, frame.id);
    const latest = useStore.getState();
    const items = latest.selection
      .map((id) => {
        for (const f of latest.project.frames) {
          const found = f.elements.find((x) => x.id === id);
          if (found) return { id, frameId: f.id, x: found.x, y: found.y };
        }
        return null;
      })
      .filter(Boolean) as { id: string; frameId: string; x: number; y: number }[];
    if (!items.length) return;
    interaction.current = {
      kind: "drag-el",
      startX: e.clientX,
      startY: e.clientY,
      items,
      snapshot: structuredClone(latest.project),
      moved: false,
    };
    setInteractionBusy(true);
  };

  const onResizeStart = (e: React.PointerEvent, frame: Frame, el: NapkinElement, dir: ResizeDir) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    useStore.getState().selectElements([el.id], frame.id);
    interaction.current = {
      kind: "resize",
      dir,
      startX: e.clientX,
      startY: e.clientY,
      elId: el.id,
      frameId: frame.id,
      startRect: { x: el.x, y: el.y, w: el.w, h: el.h },
      snapshot: structuredClone(useStore.getState().project),
      moved: false,
    };
    setInteractionBusy(true);
  };

  const onFrameDragStart = (e: React.PointerEvent, frame: Frame) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const state = useStore.getState();
    if (spaceDown || tool === "hand") {
      startPan(e);
      return;
    }
    state.selectFrame(frame.id);
    interaction.current = {
      kind: "drag-frame",
      frameId: frame.id,
      startX: e.clientX,
      startY: e.clientY,
      x: frame.x,
      y: frame.y,
      snapshot: structuredClone(state.project),
      moved: false,
    };
    setInteractionBusy(true);
  };

  const beginMarquee = (world: Point, additive: boolean) => {
    interaction.current = { kind: "marquee", start: world, current: world, additive };
    setMarquee({ x: world.x, y: world.y, w: 0, h: 0 });
  };

  const onArtboardPointerDown = (e: React.PointerEvent, frame: Frame) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.stopPropagation();
    const state = useStore.getState();
    if (spaceDown || tool === "hand") {
      startPan(e);
      return;
    }
    if (state.armed) {
      startArmedDraw(e, frame);
      return;
    }
    const world = pointerToWorld(e.clientX, e.clientY);
    if (!world) return;
    if (e.shiftKey) {
      state.selectElements(state.selection, frame.id);
    } else {
      state.selectFrame(frame.id);
    }
    beginMarquee(world, e.shiftKey);
  };

  const onArtboardDoubleClick = (e: React.MouseEvent, frame: Frame) => {
    e.stopPropagation();
    const state = useStore.getState();
    if (state.armed) return;
    const world = pointerToWorld(e.clientX, e.clientY);
    if (!world) return;
    const spec = SPECS.text;
    const w = Math.min(spec.defaultW, frame.w - 32);
    const h = Math.min(spec.defaultH, frame.h - 32);
    const x = clamp(snap(world.x - frame.x - w / 2, 4), 4, Math.max(4, frame.w - w - 4));
    const y = clamp(snap(world.y - frame.y - h / 2, 4), 4, Math.max(4, frame.h - h - 4));
    const el = state.insertElement(frame.id, "text", x, y, w, h, { label: "" });
    if (el) onStartEdit(frame, el);
  };

  const onStartEdit = (frame: Frame, el: NapkinElement) => {
    const vp = viewportRef.current;
    const art = frameRegistry.get(frame.id)?.artboard;
    if (!vp || !art) return;
    const artRect = art.getBoundingClientRect();
    const vpRect = vp.getBoundingClientRect();
    const state = useStore.getState();
    state.selectElements([el.id], frame.id);
    const width = Math.max(220, Math.min(el.w * state.view.zoom + 40, 340));
    const left = clamp(artRect.left - vpRect.left + el.x * state.view.zoom, 12, vp.clientWidth - width - 12);
    const top = clamp(artRect.top - vpRect.top + el.y * state.view.zoom, 12, vp.clientHeight - 70);
    setEditing({ frameId: frame.id, elId: el.id, value: el.props.label ?? "", left, top, width });
  };

  const onCanvasBackgroundDown = (e: React.PointerEvent) => {
    if (e.button === 2) return;
    const vp = viewportRef.current;
    if (!vp) return;
    if (e.target !== e.currentTarget) return;
    if (e.button === 1 || spaceDown || tool === "hand") {
      e.preventDefault();
      startPan(e);
      return;
    }
    if (e.button !== 0) return;
    const world = pointerToWorld(e.clientX, e.clientY);
    if (!world) return;
    const state = useStore.getState();
    if (!e.shiftKey) state.selectFrame(null);
    beginMarquee(world, e.shiftKey);
  };

  const onCanvasDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target !== viewportRef.current && !target.classList.contains("canvas-world")) return;
    if (useStore.getState().armed) return;
    useStore.getState().setPaletteOpen(true);
  };

  const onCanvasDrop = (e: React.DragEvent) => {
    const files = imageFilesFromDataTransfer(e.dataTransfer);
    if (!files.length) return;
    e.preventDefault();
    const world = pointerToWorld(e.clientX, e.clientY);
    let drop: { frameId: string; x: number; y: number } | undefined;
    if (world) {
      const frame = frames.find(
        (f) => world.x >= f.x && world.x <= f.x + f.w && world.y >= f.y && world.y <= f.y + f.h,
      );
      if (frame) drop = { frameId: frame.id, x: world.x - frame.x, y: world.y - frame.y };
    }
    void importImageFiles(files, { drop }).catch(() =>
      useStore.getState().showToast("That image could not be read"),
    );
  };

  // Single set of window listeners for all gestures
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      lastPointer.current = { x: e.clientX, y: e.clientY };
      const world = pointerToWorld(e.clientX, e.clientY);
      const act = interaction.current;
      if (!act) {
        const armedNow = useStore.getState().armed;
        if (armedNow && world) {
          const state = useStore.getState();
          const frame = state.project.frames.find(
            (f) => world.x >= f.x && world.x <= f.x + f.w && world.y >= f.y && world.y <= f.y + f.h,
          );
          if (frame) {
            const spec = SPECS[armedNow.type];
            const w = Math.min(armedNow.w ?? spec.defaultW, frame.w - 32);
            const h = Math.min(armedNow.h ?? spec.defaultH, frame.h - 32);
            setGhost({
              frameId: frame.id,
              x: clamp(world.x - frame.x - w / 2, 8, frame.w - w - 8),
              y: clamp(world.y - frame.y - h / 2, 8, frame.h - h - 8),
              w,
              h,
            });
          } else setGhost(null);
        } else {
          setGhost((prevGhost) => (prevGhost ? null : prevGhost));
        }
        return;
      }
      const state = useStore.getState();
      const z = state.view.zoom;
      if (act.kind === "pan") {
        setView({ tx: act.tx + (e.clientX - act.startX), ty: act.ty + (e.clientY - act.startY) });
        return;
      }
      if (act.kind === "marquee" && world) {
        act.current = world;
        setMarquee({
          x: Math.min(act.start.x, world.x),
          y: Math.min(act.start.y, world.y),
          w: Math.abs(world.x - act.start.x),
          h: Math.abs(world.y - act.start.y),
        });
        return;
      }
      if (act.kind === "drag-el") {
        const dx = (e.clientX - act.startX) / z;
        const dy = (e.clientY - act.startY) / z;
        if (!act.moved && Math.hypot(e.clientX - act.startX, e.clientY - act.startY) < 3) return;
        if (!act.moved) {
          act.moved = true;
          state.snapshot(act.snapshot as never);
        }
        act.items.forEach((item) => {
          const frame = state.project.frames.find((f) => f.id === item.frameId);
          if (!frame) return;
          const nx = clamp(snap(item.x + dx), 0, Math.max(0, frame.w - 8));
          const ny = clamp(snap(item.y + dy), 0, Math.max(0, frame.h - 8));
          state.updateElement(item.id, { x: nx, y: ny }, false);
        });
        return;
      }
      if (act.kind === "resize") {
        const dx = (e.clientX - act.startX) / z;
        const dy = (e.clientY - act.startY) / z;
        if (!act.moved && Math.hypot(dx, dy) < 1) return;
        if (!act.moved) {
          act.moved = true;
          state.snapshot(act.snapshot as never);
        }
        let { x, y, w, h } = act.startRect;
        const min = 8;
        if (act.dir.includes("e")) w = Math.max(min, snap(act.startRect.w + dx));
        if (act.dir.includes("s")) h = Math.max(min, snap(act.startRect.h + dy));
        if (act.dir.includes("w")) {
          const nx = snap(act.startRect.x + dx);
          w = Math.max(min, act.startRect.w + (act.startRect.x - nx));
          x = nx;
        }
        if (act.dir.includes("n")) {
          const ny = snap(act.startRect.y + dy);
          h = Math.max(min, act.startRect.h + (act.startRect.y - ny));
          y = ny;
        }
        const frame = state.project.frames.find((f) => f.id === act.frameId);
        if (frame) {
          x = clamp(x, 0, frame.w - w);
          y = clamp(y, 0, frame.h - h);
          w = Math.min(w, frame.w - x);
          h = Math.min(h, frame.h - y);
        }
        state.updateElement(act.elId, { x, y, w, h }, false);
        return;
      }
      if (act.kind === "drag-frame") {
        const dx = (e.clientX - act.startX) / z;
        const dy = (e.clientY - act.startY) / z;
        if (!act.moved && Math.hypot(dx, dy) < 2) return;
        if (!act.moved) {
          act.moved = true;
          state.snapshot(act.snapshot as never);
        }
        state.updateFrame(act.frameId, { x: snap(act.x + dx), y: snap(act.y + dy) }, false);
        return;
      }
      if (act.kind === "armed" && world) {
        const frame = state.project.frames.find((f) => f.id === act.frameId);
        if (!frame) return;
        const lx = world.x - frame.x;
        const ly = world.y - frame.y;
        act.current = { x: lx, y: ly };
        const w = Math.abs(lx - act.start.x);
        const h = Math.abs(ly - act.start.y);
        if (w > 8 || h > 8) {
          act.dragged = true;
          setGhost({
            frameId: frame.id,
            x: Math.min(act.start.x, lx),
            y: Math.min(act.start.y, ly),
            w: Math.max(8, w),
            h: Math.max(8, h),
          });
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      const act = interaction.current;
      const state = useStore.getState();
      if (act?.kind === "marquee") {
        const rect = {
          x: Math.min(act.start.x, act.current.x),
          y: Math.min(act.start.y, act.current.y),
          w: Math.abs(act.current.x - act.start.x),
          h: Math.abs(act.current.y - act.start.y),
        };
        if (rect.w > 2 || rect.h > 2) {
          const hits: string[] = [];
          let hitFrameId: string | undefined;
          state.project.frames.forEach((f) => {
            f.elements.forEach((el) => {
              const ex1 = f.x + el.x;
              const ey1 = f.y + el.y;
              const ex2 = ex1 + el.w;
              const ey2 = ey1 + el.h;
              if (ex1 < rect.x + rect.w && ex2 > rect.x && ey1 < rect.y + rect.h && ey2 > rect.y) {
                hits.push(el.id);
                if (!hitFrameId) hitFrameId = f.id;
              }
            });
          });
          state.selectElements(act.additive ? Array.from(new Set([...state.selection, ...hits])) : hits, hitFrameId);
        }
        setMarquee(null);
      }
      if (act?.kind === "armed") {
        const frame = state.project.frames.find((f) => f.id === act.frameId);
        const armedNow = state.armed;
        if (frame) {
          const spec = SPECS[armedNow?.type ?? "rectangle"];
          let x;
          let y;
          let w;
          let h;
          if (act.dragged) {
            x = Math.min(act.start.x, act.current.x);
            y = Math.min(act.start.y, act.current.y);
            w = Math.abs(act.current.x - act.start.x);
            h = Math.abs(act.current.y - act.start.y);
          } else {
            w = Math.min(armedNow?.w ?? spec.defaultW, frame.w - 32);
            h = Math.min(armedNow?.h ?? spec.defaultH, frame.h - 32);
            x = act.start.x - w / 2;
            y = act.start.y - h / 2;
          }
          x = clamp(snap(x, 4), 4, Math.max(4, frame.w - w - 4));
          y = clamp(snap(y, 4), 4, Math.max(4, frame.h - h - 4));
          w = Math.max(16, Math.min(w, frame.w - x - 4));
          h = Math.max(8, Math.min(h, frame.h - y - 4));
          const type = armedNow?.type;
          if (type) {
            const extra = {
              ...(armedNow?.props ?? {}),
              ...(armedNow?.variant ? { variant: armedNow.variant } : {}),
            };
            state.insertElement(frame.id, type, x, y, w, h, Object.keys(extra).length ? extra : undefined);
            if (!e.shiftKey) setArmed(null);
            else state.setArmed(armedNow);
          }
        }
        setGhost(null);
      }
      if (act?.kind === "pan") setInteractionBusy(false);
      if (act?.kind === "drag-el" || act?.kind === "resize" || act?.kind === "drag-frame") {
        setInteractionBusy(false);
      }
      interaction.current = null;
      setGhost((g) => (useStore.getState().armed ? g : null));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pointerToWorld, setView, setArmed]);

  // Keep the ghost fresh when armed via keyboard/library but pointer isn't moving
  useEffect(() => {
    if (!armed) setGhost(null);
  }, [armed]);

  const commitEdit = (value: string) => {
    if (!editing) return;
    const state = useStore.getState();
    const current = state.project.frames.flatMap((f) => f.elements).find((e) => e.id === editing.elId);
    if (current && (current.props.label ?? "") !== value) {
      state.updateProps(editing.elId, { label: value });
    }
    setEditing(null);
  };

  const empty = frames.length === 0;
  const gridSize = 24 * zoom;
  const ghostFrame = ghost ? frames.find((f) => f.id === ghost.frameId) : null;
  const armedSpec = armed ? SPECS[armed.type] : null;

  return (
    <div
      className={`canvas-viewport ${spaceDown ? "is-space" : ""} ${interactionBusy ? "is-busy" : ""} ${tool === "hand" ? "is-hand" : ""} ${armed ? "is-armed" : ""}`}
      ref={viewportRef}
      onPointerDown={onCanvasBackgroundDown}
      onDoubleClick={onCanvasDoubleClick}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes("Files")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={onCanvasDrop}
      onPointerMove={(e) => {
        lastPointer.current = { x: e.clientX, y: e.clientY };
      }}
      style={
        grid
          ? {
              backgroundImage: "radial-gradient(circle, rgba(38,35,43,.16) 1.05px, transparent 1.3px)",
              backgroundSize: `${gridSize}px ${gridSize}px`,
              backgroundPosition: `${view.tx}px ${view.ty}px`,
            }
          : { backgroundImage: "none" }
      }
    >
      {empty && (
        <div className="empty-state">
          <div className="empty-doodle" aria-hidden>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <path d="M10 50 C 20 26, 32 16, 52 12" fill="none" stroke="#26232B" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M43 10 L53 12 L49 21" fill="none" stroke="#26232B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 14 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3z" fill="none" stroke="#F0643C" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="empty-kicker">a blank napkin</div>
          <h1 className="empty-title">Start with a sketch.</h1>
          <p className="empty-sub">
            Pick a canvas below, then press <kbd>/</kbd> to add anything — a search bar, a button, a whole navigation bar.
          </p>
          <div className="empty-frames">
            {(["phone", "tablet", "desktop", "blank"] as const).map((preset) => (
              <button
                key={preset}
                className="btn btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  const f = useStore.getState().addFrame(preset);
                  setTimeout(() => centerOnFrame(f.id), 30);
                }}
              >
                <span className="mini-frame-icon" data-preset={preset} />
                {FRAME_PRESETS[preset].label}
              </button>
            ))}
          </div>
          <div className="empty-foot">
            <button className="link-btn" onClick={() => useStore.getState().newProject("demo")}>
              or open the demo board →
            </button>
            <span className="empty-keys"><kbd>F</kbd> frame · <kbd>/</kbd> add · <kbd>?</kbd> shortcuts</span>
          </div>
        </div>
      )}

      <div
        className="canvas-world"
        style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${zoom})`, transformOrigin: "0 0" }}
      >
        {frames.map((frame) => (
          <FrameView
            key={frame.id}
            frame={frame}
            zoom={zoom}
            onArtboardPointerDown={onArtboardPointerDown}
            onElementPointerDown={onElementPointerDown}
            onResizeStart={onResizeStart}
            onStartEdit={onStartEdit}
            onFrameDragStart={onFrameDragStart}
            onArtboardDoubleClick={onArtboardDoubleClick}
          />
        ))}

        {ghost && ghostFrame && (
          <div
            className="armed-ghost"
            style={{
              left: ghostFrame.x + ghost.x,
              top: ghostFrame.y + ghost.y,
              width: ghost.w,
              height: ghost.h,
              ["--inv" as string]: 1 / zoom,
            }}
          >
            <span className="armed-ghost-label">
              {armedSpec?.name ?? "Component"} · {Math.round(ghost.w)} × {Math.round(ghost.h)}
            </span>
          </div>
        )}

        {marquee && (
          <div
            className="marquee"
            style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          />
        )}
      </div>

      {editing && (
        <InlineEditor editing={editing} onCommit={commitEdit} onCancel={() => setEditing(null)} />
      )}

      <div className="canvas-hint">
        <button
          className={`hint-tool ${tool === "select" ? "active" : ""}`}
          onClick={() => setTool("select")}
          title="Select (V)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 3l7.5 18 2.4-7.1 7.1-2.4L4 3z" />
          </svg>
        </button>
        <button
          className={`hint-tool ${tool === "hand" ? "active" : ""}`}
          onClick={() => setTool(tool === "hand" ? "select" : "hand")}
          title="Hand (H) — or hold Space"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V10M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.8-2.4L4 14.5a1.6 1.6 0 0 1 2.4-2.1L8 14" />
          </svg>
        </button>
        <span className="hint-divider" />
        <span className="hint-text">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
