import { useStore } from "../store";
import type { Frame, NapkinElement } from "../types";
import { canvasApi } from "./canvasApi";
import { clamp } from "./geometry";

const MAX_IMPORT_DIM = 2000;

export interface ImportedImage {
  src: string;
  width: number;
  height: number;
}

export interface ImportImageOptions {
  /** Replace the image inside this element instead of placing a new one. */
  elementId?: string;
  /** Canvas drop target, in frame-local coordinates. */
  drop?: { frameId: string; x: number; y: number };
}

function loadSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be read"));
    img.src = src;
  });
}

function encodeCanvas(canvas: HTMLCanvasElement): string {
  const webp = canvas.toDataURL("image/webp", 0.92);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/png");
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|bmp)$/i.test(file.name);
}

/** Read a local image, downscale enormous screenshots, and return a compact data URL. */
export async function readImageFile(file: File): Promise<ImportedImage> {
  if (!isImageFile(file)) throw new Error("That file is not an image");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadSource(url);
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    if (!naturalW || !naturalH) throw new Error("That image has no pixels");
    const scale = Math.min(1, MAX_IMPORT_DIM / Math.max(naturalW, naturalH));
    const width = Math.max(1, Math.round(naturalW * scale));
    const height = Math.max(1, Math.round(naturalH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable");
    ctx.drawImage(img, 0, 0, width, height);
    return { src: encodeCanvas(canvas), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Crop an already imported image. `rect` is in source pixels. */
export async function cropImageSource(
  src: string,
  rect: { x: number; y: number; w: number; h: number },
): Promise<ImportedImage> {
  const img = await loadSource(src);
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  const sx = clamp(rect.x, 0, Math.max(0, naturalW - 1));
  const sy = clamp(rect.y, 0, Math.max(0, naturalH - 1));
  const sw = clamp(rect.w, 1, naturalW - sx);
  const sh = clamp(rect.h, 1, naturalH - sy);
  const width = Math.max(1, Math.round(sw));
  const height = Math.max(1, Math.round(sh));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  return { src: encodeCanvas(canvas), width, height };
}

function findElement(id: string): { el: NapkinElement; frame: Frame } | null {
  const state = useStore.getState();
  for (const frame of state.project.frames) {
    const el = frame.elements.find((e) => e.id === id);
    if (el) return { el, frame };
  }
  return null;
}

function fitInFrame(frame: Frame, img: ImportedImage) {
  const maxW = Math.max(48, frame.w - 32);
  const maxH = Math.max(48, frame.h - 32);
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  return {
    w: Math.max(24, Math.round(img.width * scale)),
    h: Math.max(24, Math.round(img.height * scale)),
  };
}

async function replaceElementImage(elId: string, file: File) {
  const found = findElement(elId);
  if (!found) return false;
  const img = await readImageFile(file);
  const state = useStore.getState();
  const hadSource = !!found.el.props.src;
  state.snapshot();
  state.updateProps(elId, { src: img.src }, false);
  if (!hadSource) {
    // A placeholder can adopt the image's aspect ratio. Replacements keep their box.
    let w = Math.max(24, found.el.w);
    let h = Math.max(24, Math.round((w * img.height) / img.width));
    const maxW = Math.max(24, found.frame.w - found.el.x - 8);
    const maxH = Math.max(24, found.frame.h - found.el.y - 8);
    const scale = Math.min(1, maxW / w, maxH / h);
    w = Math.max(24, Math.round(w * scale));
    h = Math.max(24, Math.round(h * scale));
    state.updateElement(elId, { w, h }, false);
  }
  state.showToast("Image replaced");
  return true;
}

function targetFrame(drop?: ImportImageOptions["drop"]): Frame | null {
  const state = useStore.getState();
  if (drop) {
    const dropped = state.project.frames.find((f) => f.id === drop.frameId);
    if (dropped) return dropped;
  }
  return (
    state.project.frames.find((f) => f.id === state.selectedFrameId) ??
    state.project.frames[0] ??
    null
  );
}

/** Import one or more images as new image elements, or replace an existing element's source. */
export async function importImageFiles(files: File[], options: ImportImageOptions = {}) {
  const images = files.filter(isImageFile);
  if (!images.length) {
    useStore.getState().showToast("Those files are not images");
    return 0;
  }

  if (options.elementId) {
    const ok = await replaceElementImage(options.elementId, images[0]);
    return ok ? 1 : 0;
  }

  const state = useStore.getState();
  let frame = targetFrame(options.drop);
  const loaded: ImportedImage[] = [];
  for (const file of images) {
    try {
      loaded.push(await readImageFile(file));
    } catch {
      /* skip unreadable files */
    }
  }
  if (!loaded.length) {
    state.showToast("Those images could not be read");
    return 0;
  }

  if (!frame) {
    const first = loaded[0];
    const fw = Math.min(1440, Math.max(360, first.width));
    const fh = Math.min(1200, Math.max(280, Math.round((fw * first.height) / first.width)));
    frame = state.addFrame("custom", "Imported screen", fw, fh);
  }

  const target = frame;
  let added = 0;
  loaded.forEach((img, index) => {
    const { w, h } = fitInFrame(target, img);
    const offset = index * 18;
    const centerX = options.drop && index === 0 ? options.drop.x : target.w / 2;
    const centerY = options.drop && index === 0 ? options.drop.y : target.h / 2;
    const x = clamp(Math.round(centerX - w / 2 + offset), 8, Math.max(8, target.w - w - 8));
    const y = clamp(Math.round(centerY - h / 2 + offset), 8, Math.max(8, target.h - h - 8));
    const el = useStore
      .getState()
      .insertElement(target.id, "image", x, y, w, h, { src: img.src, fit: "cover" }, true);
    if (el) added++;
  });

  if (added > 0) {
    const after = useStore.getState();
    after.setFlyout(null);
    after.showToast(
      added === 1 ? "Screenshot added — crop it from the inspector" : `${added} images added`,
    );
    setTimeout(() => canvasApi.centerOnFrame(target.id), 30);
  }
  return added;
}

export function imageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.files ?? []).filter(isImageFile);
}
