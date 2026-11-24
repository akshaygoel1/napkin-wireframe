import { useEffect, useRef, useState } from "react";
import { Crop, RotateCcw } from "lucide-react";
import { useStore } from "../store";
import { cropImageSource } from "../utils/images";
import { clamp } from "../utils/geometry";
import { DialogHead, Modal } from "./Modal";

type CropBox = { x: number; y: number; w: number; h: number };
type DragMode = "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

const HANDLES: DragMode[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const MIN_CROP = 0.04;
const FULL: CropBox = { x: 0, y: 0, w: 1, h: 1 };

export function CropDialog() {
  const cropId = useStore((s) => s.cropId);
  const setCropId = useStore((s) => s.setCropId);
  const project = useStore((s) => s.project);
  const found = cropId
    ? project.frames
        .map((frame) => ({ frame, el: frame.elements.find((e) => e.id === cropId) }))
        .find((entry) => entry.el)
    : null;
  const el = found?.el ?? null;
  const src = el?.type === "image" ? el.props.src : undefined;

  const [box, setBox] = useState<CropBox>(FULL);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [drag, setDrag] = useState<{ mode: DragMode; startX: number; startY: number; box: CropBox } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBox(FULL);
    setNatural(null);
    setError(null);
    if (!src) return;
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setError("That image could not be read");
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [cropId, src]);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect.height) return;
      const dx = (e.clientX - drag.startX) / rect.width;
      const dy = (e.clientY - drag.startY) / rect.height;
      const start = drag.box;
      if (drag.mode === "move") {
        setBox({
          ...start,
          x: clamp(start.x + dx, 0, 1 - start.w),
          y: clamp(start.y + dy, 0, 1 - start.h),
        });
        return;
      }
      let { x, y, w, h } = start;
      const right = start.x + start.w;
      const bottom = start.y + start.h;
      if (drag.mode.includes("e")) w = clamp(start.w + dx, MIN_CROP, 1 - start.x);
      if (drag.mode.includes("s")) h = clamp(start.h + dy, MIN_CROP, 1 - start.y);
      if (drag.mode.includes("w")) {
        x = clamp(start.x + dx, 0, right - MIN_CROP);
        w = right - x;
      }
      if (drag.mode.includes("n")) {
        y = clamp(start.y + dy, 0, bottom - MIN_CROP);
        h = bottom - y;
      }
      setBox({ x, y, w, h });
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag]);

  if (!cropId || !el || el.type !== "image" || !src) return null;

  const close = () => {
    if (!busy) setCropId(null);
  };

  const begin = (e: React.PointerEvent, mode: DragMode) => {
    if (busy) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode, startX: e.clientX, startY: e.clientY, box });
  };

  const apply = async () => {
    if (!natural || busy) return;
    setBusy(true);
    setError(null);
    try {
      const cropped = await cropImageSource(src, {
        x: Math.round(box.x * natural.w),
        y: Math.round(box.y * natural.h),
        w: Math.round(box.w * natural.w),
        h: Math.round(box.h * natural.h),
      });
      const state = useStore.getState();
      const frame = state.project.frames.find((f) => f.elements.some((e) => e.id === el.id));
      const live = frame?.elements.find((e) => e.id === el.id);
      if (!frame || !live) {
        setCropId(null);
        return;
      }
      const aspect = cropped.width / cropped.height;
      let w = Math.max(24, live.w);
      let h = Math.max(24, Math.round(w / aspect));
      const maxW = Math.max(24, frame.w - live.x - 8);
      const maxH = Math.max(24, frame.h - live.y - 8);
      const scale = Math.min(1, maxW / w, maxH / h);
      w = Math.max(16, Math.round(w * scale));
      h = Math.max(16, Math.round(h * scale));
      state.snapshot();
      state.updateProps(el.id, { src: cropped.src }, false);
      state.updateElement(el.id, { w, h }, false);
      state.showToast("Image cropped");
      setBusy(false);
      setCropId(null);
    } catch {
      setError("The crop could not be applied. Try a smaller selection.");
      setBusy(false);
    }
  };

  const dims = natural
    ? `${Math.max(1, Math.round(box.w * natural.w))} × ${Math.max(1, Math.round(box.h * natural.h))} px`
    : "Loading image…";

  return (
    <Modal onClose={close} className="crop-dialog" label="Crop image">
      <DialogHead
        eyebrow="Image"
        title="Crop image"
        subtitle="Drag inside to move the crop. Drag a handle to trim any edge."
        onClose={close}
        icon={<Crop size={19} />}
      />
      <div className="crop-body">
        <div className="crop-stage">
          <div className="crop-image-wrap" ref={wrapRef}>
            <img src={src} alt="" draggable={false} />
            <div
              className="crop-box"
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
              }}
              onPointerDown={(e) => begin(e, "move")}
            >
              <span className="crop-grid" aria-hidden />
              {HANDLES.map((dir) => (
                <span
                  key={dir}
                  className={`crop-handle is-${dir}`}
                  onPointerDown={(e) => begin(e, dir)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="crop-readout">
          <span>{dims}</span>
          <span className="crop-hint">No upload — the image stays on this device.</span>
        </div>
        {error && <div className="crop-error">{error}</div>}
      </div>
      <div className="crop-foot">
        <button className="btn btn-ghost" onClick={() => setBox(FULL)} disabled={busy}>
          <RotateCcw size={14} /> Reset
        </button>
        <span className="crop-foot-spacer" />
        <button className="btn btn-ghost" onClick={close} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={apply} disabled={busy || !natural}>
          {busy ? "Cropping…" : "Apply crop"}
        </button>
      </div>
    </Modal>
  );
}
