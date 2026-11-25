import { useStore } from "../store";
import type { Point } from "../types";
import { canvasApi } from "./canvasApi";
import { clamp } from "./geometry";

const MAX_IMPORT_DIM = 2000;
/** Free images are laid out at a readable size on the infinite canvas. */
const MAX_PLACED_DIM = 560;

export interface ImportedImage {
  src: string;
  width: number;
  height: number;
}

export interface ImportImageOptions {
  /** Replace the image inside this element instead of placing a new one. */
  elementId?: string;
  /** Canvas drop point, in world coordinates. The image is centred on it. */
  drop?: Point;
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

/** Where a new free image should sit when it was not dropped on the canvas. */
function defaultDropPoint(): Point {
  const vp = canvasApi.viewport;
  const rect = vp?.getBoundingClientRect();
  const pointer = canvasApi.lastPointer;
  const inside =
    !!rect &&
    !!pointer &&
    pointer.x >= rect.left &&
    pointer.x <= rect.right &&
    pointer.y >= rect.top &&
    pointer.y <= rect.bottom;
  const px = inside ? pointer!.x : rect ? rect.left + rect.width / 2 : null;
  const py = inside ? pointer!.y : rect ? rect.top + rect.height / 2 : null;
  if (px != null && py != null) {
    const world = canvasApi.clientToWorld(px, py);
    if (world) return world;
  }
  return { x: 0, y: 0 };
}

/** Fit a natural image into a comfortable on-canvas box. */
function placedSize(img: ImportedImage) {
  const scale = Math.min(MAX_PLACED_DIM / img.width, MAX_PLACED_DIM / img.height);
  return {
    w: Math.max(24, Math.round(img.width * scale)),
    h: Math.max(24, Math.round(img.height * scale)),
  };
}

async function replaceElementImage(elId: string, file: File) {
  const state = useStore.getState();
  const img = await readImageFile(file);
  for (const frame of state.project.frames) {
    const el = frame.elements.find((e) => e.id === elId);
    if (!el) continue;
    // A frame-owned image was imported before free images existed. Detach it so
    // the replacement becomes a normal canvas-level image.
    const worldX = frame.x + el.x;
    const worldY = frame.y + el.y;
    const hadSource = !!el.props.src;
    const { w, h } = hadSource
      ? { w: Math.max(24, el.w), h: Math.max(24, el.h) }
      : placedSize(img);
    const created = useStore
      .getState()
      .insertFreeImage("image", worldX, worldY, w, h, { src: img.src, fit: "cover" }, true);
    if (!created) return false;
    useStore.getState().removeElements([elId], false);
    useStore.getState().showToast("Image replaced");
    return true;
  }

  const free = state.project.images.find((e) => e.id === elId);
  if (!free) return false;
  const hadSource = !!free.props.src;
  state.snapshot();
  state.updateProps(elId, { src: img.src }, false);
  if (!hadSource) {
    const { w, h } = placedSize(img);
    state.updateElement(elId, { w, h }, false);
  }
  state.showToast("Image replaced");
  return true;
}

/** Import one or more images as free canvas images, or replace an existing image's source. */
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

  const drop = options.drop ?? defaultDropPoint();
  let added = 0;
  loaded.forEach((img, index) => {
    const { w, h } = placedSize(img);
    const offset = index * 18;
    const x = Math.round(drop.x - w / 2 + offset);
    const y = Math.round(drop.y - h / 2 + offset);
    const el = useStore
      .getState()
      .insertFreeImage("image", x, y, w, h, { src: img.src, fit: "cover" }, true);
    if (el) added++;
  });

  if (added > 0) {
    const after = useStore.getState();
    after.setFlyout(null);
    after.showToast(
      added === 1 ? "Screenshot added — crop it from the inspector" : `${added} images added`,
    );
  }
  return added;
}

export function imageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.files ?? []).filter(isImageFile);
}
