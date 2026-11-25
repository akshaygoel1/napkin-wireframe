import type { Frame, NapkinElement, Preset } from "../types";

export interface ShellMetrics {
  padX: number;
  padTop: number;
  padBottom: number;
  labelH: number;
  radius: number;
}

export function shellMetrics(frame: Pick<Frame, "preset" | "shell">): ShellMetrics {
  if (!frame.shell) return { padX: 0, padTop: 0, padBottom: 0, labelH: 34, radius: 4 };
  switch (frame.preset) {
    case "phone":
      return { padX: 16, padTop: 16, padBottom: 16, labelH: 34, radius: 48 };
    case "tablet":
      return { padX: 20, padTop: 20, padBottom: 20, labelH: 34, radius: 30 };
    case "desktop":
      return { padX: 1, padTop: 36, padBottom: 1, labelH: 34, radius: 10 };
    default:
      return { padX: 0, padTop: 0, padBottom: 0, labelH: 34, radius: 4 };
  }
}

export function frameBlockRect(frame: Frame) {
  const m = shellMetrics(frame);
  return {
    x: frame.x - m.padX,
    y: frame.y - m.padTop - m.labelH,
    w: frame.w + m.padX * 2,
    h: frame.h + m.padTop + m.padBottom + m.labelH,
  };
}

export function projectBounds(frames: Frame[], images: NapkinElement[] = []) {
  if (!frames.length && !images.length) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  frames.forEach((f) => {
    const r = frameBlockRect(f);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  });
  images.forEach((el) => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.w);
    maxY = Math.max(maxY, el.y + el.h);
  });
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function snap(v: number, grid = 8) {
  return Math.round(v / grid) * grid;
}

export function nearestFrame(frames: Frame[], x: number, y: number): Frame | null {
  let best: Frame | null = null;
  let bestDist = Infinity;
  for (const f of frames) {
    if (x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h) return f;
    const cx = clamp(x, f.x, f.x + f.w);
    const cy = clamp(y, f.y, f.y + f.h);
    const d = (cx - x) ** 2 + (cy - y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return best;
}

export const PRESET_ICON: Record<Preset, string> = {
  phone: "smartphone",
  tablet: "tablet",
  desktop: "desktop_windows",
  blank: "frame",
  custom: "frame",
};
