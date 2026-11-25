import { toPng } from "html-to-image";
import JSZip from "jszip";
import type { Frame, Project } from "../types";
import { frameBlockRect, shellMetrics } from "./geometry";
import { frameRegistry } from "./canvasApi";

export interface ExportOptions {
  scale: 1 | 2 | 3 | 4;
  background: "transparent" | "white" | "paper";
  includeTitle: boolean;
  includeMarkup: boolean;
}

const EXPORT_PREFS_KEY = "napkin.export.v1";

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  scale: 2,
  background: "white",
  includeTitle: false,
  includeMarkup: false,
};

export function loadExportOptions(): ExportOptions {
  try {
    const raw = localStorage.getItem(EXPORT_PREFS_KEY);
    if (!raw) return { ...DEFAULT_EXPORT_OPTIONS };
    const parsed = JSON.parse(raw);
    return {
      scale: [1, 2, 3, 4].includes(parsed.scale) ? parsed.scale : DEFAULT_EXPORT_OPTIONS.scale,
      background: ["transparent", "white", "paper"].includes(parsed.background)
        ? parsed.background
        : DEFAULT_EXPORT_OPTIONS.background,
      includeTitle: typeof parsed.includeTitle === "boolean" ? parsed.includeTitle : DEFAULT_EXPORT_OPTIONS.includeTitle,
      includeMarkup: typeof parsed.includeMarkup === "boolean" ? parsed.includeMarkup : DEFAULT_EXPORT_OPTIONS.includeMarkup,
    };
  } catch {
    return { ...DEFAULT_EXPORT_OPTIONS };
  }
}

export function saveExportOptions(opts: ExportOptions) {
  try {
    localStorage.setItem(EXPORT_PREFS_KEY, JSON.stringify(opts));
  } catch {
    /* ignore */
  }
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]+/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-") || "frame"
  );
}

function filenameFor(project: Project, frame: Frame, existing: Set<string>): string {
  const base = `${slugify(project.name)}-${slugify(frame.name)}`;
  let name = `${base}.png`;
  let i = 2;
  while (existing.has(name)) {
    name = `${base}-${i}.png`;
    i++;
  }
  existing.add(name);
  return name;
}

export function framePixelSize(frame: Frame, scale: number, includeTitle = false) {
  const r = frameBlockRect(frame);
  const m = shellMetrics(frame);
  return { w: Math.round(r.w * scale), h: Math.round((r.h - (includeTitle ? 0 : m.labelH)) * scale) };
}

export function tooLarge(frame: Frame, scale: number) {
  const { w, h } = framePixelSize(frame, scale);
  return w > 8192 || h > 8192;
}

function downscaleBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function applyExportClasses(opts: ExportOptions) {
  const root = document.documentElement;
  root.classList.add("is-exporting");
  root.classList.remove("export-bg-transparent", "export-bg-white", "export-bg-paper");
  root.classList.add(`export-bg-${opts.background}`);
  root.classList.toggle("export-title-on", opts.includeTitle);
  root.classList.toggle("export-title-off", !opts.includeTitle);
  root.classList.toggle("export-markup-off", !opts.includeMarkup);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await document.fonts.ready;
}

function clearExportClasses() {
  const root = document.documentElement;
  root.classList.remove(
    "is-exporting",
    "export-bg-transparent",
    "export-bg-white",
    "export-bg-paper",
    "export-title-on",
    "export-title-off",
    "export-markup-off",
  );
}

export async function renderFramePng(frame: Frame, opts: ExportOptions): Promise<Blob> {
  const node = frameRegistry.get(frame.id)?.block;
  if (!node) throw new Error(`Could not find the "${frame.name}" frame`);
  if (tooLarge(frame, opts.scale)) {
    throw new Error(`${frame.name} is too large at ${opts.scale}x. Try a lower scale.`);
  }
  const m = shellMetrics(frame);
  const r = frameBlockRect(frame);
  // The live block is positioned inside the zoomed canvas world. The export
  // clone is rooted at 0,0, so reset that offset or the capture crops the shell.
  const width = Math.ceil(r.w);
  const height = Math.ceil(r.h - (opts.includeTitle ? 0 : m.labelH));
  const dataUrl = await toPng(node, {
    width,
    height,
    pixelRatio: opts.scale,
    cacheBust: true,
    skipFonts: false,
    backgroundColor: undefined,
    style: {
      transform: "none",
      transformOrigin: "top left",
      position: "relative",
      inset: "0",
      left: "0",
      top: "0",
      margin: "0",
    },
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function exportFrames(
  project: Project,
  frames: Frame[],
  opts: ExportOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<{ count: number; filenames: string[] }> {
  if (!frames.length) throw new Error("Select at least one frame to export");
  await applyExportClasses(opts);
  const existing = new Set<string>();
  const files: { name: string; blob: Blob }[] = [];
  try {
    for (let i = 0; i < frames.length; i++) {
      onProgress?.(i, frames.length);
      const blob = await renderFramePng(frames[i], opts);
      files.push({ name: filenameFor(project, frames[i], existing), blob });
      // allow the browser to paint progress
      await new Promise((r) => setTimeout(r, 30));
    }
    onProgress?.(frames.length, frames.length);
  } finally {
    clearExportClasses();
  }

  if (files.length === 1) {
    downscaleBlob(files[0].blob, files[0].name);
  } else {
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.name, f.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    downscaleBlob(blob, `${slugify(project.name)}-wireframes.zip`);
  }
  return { count: files.length, filenames: files.map((f) => f.name) };
}

export async function copyFramePng(frame: Frame, opts: ExportOptions): Promise<void> {
  await applyExportClasses(opts);
  try {
    const blob = await renderFramePng(frame, opts);
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
  } finally {
    clearExportClasses();
  }
}

export function frameSizeLabel(frame: Frame) {
  const m = shellMetrics(frame);
  return `${frame.w} × ${frame.h}`;
}
