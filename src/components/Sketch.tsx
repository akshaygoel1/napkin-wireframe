import { createContext, useContext, useMemo } from "react";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";
import { ICON_BY_NAME } from "../data/iconData";

export const INK = "#26232B";
export const MUTED = "#6F6A76";
export const FAINT = "#A8A2AC";
export const SOFT = "#E9E6E1";
export const SOFTER = "#F3F1EC";
export const PAPER = "#FFFFFF";
export const BLUE = "#4A6EE0";
export const STICKY = "#FFDF40";
export const ACCENT = "#F0643C";

const SketchContext = createContext({ roughness: 1.2, clean: false });

export function SketchProvider({
  roughness,
  clean,
  children,
}: {
  roughness: number;
  clean?: boolean;
  children: React.ReactNode;
}) {
  return <SketchContext.Provider value={{ roughness, clean: !!clean }}>{children}</SketchContext.Provider>;
}

export function useSketch() {
  return useContext(SketchContext);
}

const generator = rough.generator();

function roundedPath(w: number, h: number, r: number, inset = 0) {
  const x = inset;
  const y = inset;
  const ww = Math.max(0, w - inset * 2);
  const hh = Math.max(0, h - inset * 2);
  const rr = Math.max(0, Math.min(r, ww / 2, hh / 2));
  if (rr <= 0.5) {
    return `M ${x} ${y} L ${x + ww} ${y} L ${x + ww} ${y + hh} L ${x} ${y + hh} Z`;
  }
  return [
    `M ${x + rr} ${y}`,
    `L ${x + ww - rr} ${y}`,
    `Q ${x + ww} ${y} ${x + ww} ${y + rr}`,
    `L ${x + ww} ${y + hh - rr}`,
    `Q ${x + ww} ${y + hh} ${x + ww - rr} ${y + hh}`,
    `L ${x + rr} ${y + hh}`,
    `Q ${x} ${y + hh} ${x} ${y + hh - rr}`,
    `L ${x} ${y + rr}`,
    `Q ${x} ${y} ${x + rr} ${y}`,
    "Z",
  ].join(" ");
}

interface SketchRectProps {
  w: number;
  h: number;
  r?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  seed?: number;
  dashed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  roughness?: number;
}

export function SketchRect({
  w,
  h,
  r = 0,
  fill = PAPER,
  stroke = INK,
  strokeWidth = 1.5,
  seed = 1,
  dashed,
  className,
  style,
  roughness,
}: SketchRectProps) {
  const ctx = useSketch();
  const paths = useMemo(() => {
    if (w < 2 || h < 2) return [];
    const inset = Math.max(0.8, strokeWidth / 2);
    const opts: Options = {
      seed: seed || 1,
      roughness: roughness ?? (ctx.clean ? 0.08 : ctx.roughness * 0.85),
      bowing: ctx.clean ? 0 : 0.7,
      stroke,
      strokeWidth,
      fill: fill === "none" ? undefined : fill,
      fillStyle: "solid",
      fillWeight: 0.6,
      strokeLineDash: dashed ? [5, 4] : undefined,
      disableMultiStroke: ctx.clean,
      curveFitting: 0.95,
    };
    const drawable = generator.path(roundedPath(w, h, r, inset), opts);
    return generator.toPaths(drawable);
  }, [w, h, r, fill, stroke, strokeWidth, seed, dashed, ctx.clean, ctx.roughness, roughness]);

  if (!paths.length) return null;
  return (
    <svg
      className={`sketch-svg ${className ?? ""}`}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", ...style }}
      aria-hidden
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke === "none" ? "none" : p.stroke}
          strokeWidth={p.strokeWidth ?? strokeWidth}
          fill={p.fill ?? "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export function SketchLine({
  w,
  h,
  seed = 1,
  stroke = INK,
  strokeWidth = 1.5,
  dashed,
  className,
  style,
}: {
  w: number;
  h: number;
  seed?: number;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ctx = useSketch();
  const paths = useMemo(() => {
    if (w < 1) return [];
    const y = Math.max(strokeWidth / 2, h / 2);
    const opts: Options = {
      seed,
      roughness: ctx.clean ? 0.05 : ctx.roughness * 0.65,
      bowing: ctx.clean ? 0 : 0.8,
      stroke,
      strokeWidth,
      strokeLineDash: dashed ? [5, 4] : undefined,
      disableMultiStroke: ctx.clean,
    };
    const drawable = generator.line(0, y, w, y, opts);
    return generator.toPaths(drawable);
  }, [w, h, seed, stroke, strokeWidth, dashed, ctx.clean, ctx.roughness]);

  return (
    <svg
      className={className}
      width={Math.max(1, w)}
      height={Math.max(1, h)}
      viewBox={`0 0 ${Math.max(1, w)} ${Math.max(1, h)}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}
      aria-hidden
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke ?? stroke} strokeWidth={p.strokeWidth ?? strokeWidth} fill="none" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function SketchSegment({
  x1,
  y1,
  x2,
  y2,
  stroke = INK,
  strokeWidth = 1.5,
  seed = 1,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  seed?: number;
  opacity?: number;
}) {
  const ctx = useSketch();
  const paths = useMemo(() => {
    const opts: Options = {
      seed,
      roughness: ctx.clean ? 0.05 : ctx.roughness * 0.6,
      bowing: ctx.clean ? 0 : 0.6,
      stroke,
      strokeWidth,
      disableMultiStroke: ctx.clean,
    };
    return generator.toPaths(generator.line(x1, y1, x2, y2, opts));
  }, [x1, y1, x2, y2, stroke, strokeWidth, seed, ctx.clean, ctx.roughness]);
  const minX = Math.min(x1, x2) - 4;
  const minY = Math.min(y1, y2) - 4;
  const w = Math.abs(x2 - x1) + 8;
  const h = Math.abs(y2 - y1) + 8;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`${minX} ${minY} ${w} ${h}`}
      style={{ position: "absolute", left: minX, top: minY, overflow: "visible", pointerEvents: "none", opacity }}
      aria-hidden
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke ?? stroke} strokeWidth={p.strokeWidth ?? strokeWidth} fill="none" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function SketchCircle({
  w,
  h,
  seed = 1,
  fill = PAPER,
  stroke = INK,
  strokeWidth = 1.5,
  dashed,
  className,
  style,
}: {
  w: number;
  h: number;
  seed?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ctx = useSketch();
  const paths = useMemo(() => {
    if (w < 2 || h < 2) return [];
    const opts: Options = {
      seed,
      roughness: ctx.clean ? 0.08 : ctx.roughness * 0.7,
      bowing: ctx.clean ? 0 : 0.5,
      stroke,
      strokeWidth,
      fill: fill === "none" ? undefined : fill,
      fillStyle: "solid",
      strokeLineDash: dashed ? [5, 4] : undefined,
      disableMultiStroke: ctx.clean,
    };
    const drawable = generator.ellipse(w / 2, h / 2, Math.max(1, w - strokeWidth), Math.max(1, h - strokeWidth), opts);
    return generator.toPaths(drawable);
  }, [w, h, seed, fill, stroke, strokeWidth, dashed, ctx.clean, ctx.roughness]);

  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", ...style }}
      aria-hidden
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke === "none" ? "none" : p.stroke}
          strokeWidth={p.strokeWidth ?? strokeWidth}
          fill={p.fill ?? "none"}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export function SketchArrow({
  w,
  h,
  seed = 1,
  stroke = INK,
  strokeWidth = 1.6,
  className,
}: {
  w: number;
  h: number;
  seed?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const ctx = useSketch();
  const { main, head } = useMemo(() => {
    const x1 = 8;
    const y1 = h - 8;
    const x2 = w - 10;
    const y2 = 10;
    const cx = w * 0.32;
    const cy = h * 0.2;
    const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    const opts: Options = {
      seed,
      roughness: ctx.clean ? 0.05 : ctx.roughness * 0.75,
      bowing: ctx.clean ? 0 : 0.5,
      stroke,
      strokeWidth,
      disableMultiStroke: ctx.clean,
    };
    const gen = generator.path(d, opts);
    const angle = Math.atan2(y2 - cy, x2 - cx);
    const len = 12;
    const a1 = angle + Math.PI - 0.45;
    const a2 = angle + Math.PI + 0.45;
    const h1 = generator.line(x2, y2, x2 + Math.cos(a1) * len, y2 + Math.sin(a1) * len, opts);
    const h2 = generator.line(x2, y2, x2 + Math.cos(a2) * len, y2 + Math.sin(a2) * len, opts);
    return {
      main: generator.toPaths(gen),
      head: [...generator.toPaths(h1), ...generator.toPaths(h2)],
    };
  }, [w, h, seed, stroke, strokeWidth, ctx.clean, ctx.roughness]);

  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
      aria-hidden
    >
      {[...main, ...head].map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke ?? stroke} strokeWidth={p.strokeWidth ?? strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function pseudo(seed: number, i: number) {
  const x = Math.sin(seed * 999 + i * 77.7) * 10000;
  return x - Math.floor(x);
}

export function Squiggles({
  w,
  h,
  lines,
  seed = 1,
  stroke = MUTED,
  className,
}: {
  w: number;
  h: number;
  lines?: number;
  seed?: number;
  stroke?: string;
  className?: string;
}) {
  const count = Math.max(1, lines ?? Math.floor(h / 12));
  const lineH = h / Math.max(1, count);
  const paths = [];
  for (let i = 0; i < count; i++) {
    const y = lineH * i + lineH / 2;
    const rnd = pseudo(seed, i);
    const len = w * (i === count - 1 ? 0.45 + rnd * 0.4 : 0.86 + rnd * 0.14);
    const amp = 1.1 + rnd * 0.9;
    const wavelength = 5 + rnd * 2;
    let d = `M 0 ${y}`;
    let x = 0;
    let up = true;
    while (x < len) {
      x += wavelength;
      d += ` Q ${x - wavelength / 2} ${y + (up ? -amp : amp)} ${x} ${y}`;
      up = !up;
    }
    paths.push(d);
  }
  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
      aria-hidden
    >
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={stroke} strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.8} />
      ))}
    </svg>
  );
}

export function Glyph({
  name,
  size = 24,
  fill = false,
  weight = 400,
  glyphStyle = "rounded",
  color,
  className,
  style,
}: {
  name?: string;
  size?: number;
  fill?: boolean;
  weight?: number;
  glyphStyle?: "rounded" | "outlined" | "sharp";
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const entry = name ? ICON_BY_NAME[name] : undefined;
  if (!entry) {
    return (
      <span
        aria-hidden
        className={className}
        style={{
          display: "inline-block",
          width: size * 0.5,
          height: size * 0.5,
          border: "1.4px solid currentColor",
          borderRadius: 2,
          opacity: 0.4,
          ...style,
        }}
      />
    );
  }
  const family =
    glyphStyle === "outlined" ? "Material Symbols Outlined" : glyphStyle === "sharp" ? "Material Symbols Sharp" : "Material Symbols Rounded";
  return (
    <span
      aria-hidden
      className={`glyph ${className ?? ""}`}
      style={{
        fontFamily: family,
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${Math.min(48, Math.max(20, size))}`,
        color,
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        flex: "none",
        fontStyle: "normal",
        ...style,
      }}
    >
      {String.fromCodePoint(parseInt(entry.c, 16))}
    </span>
  );
}

export function FadeText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`wf-label ${className ?? ""}`}>{children}</div>;
}
