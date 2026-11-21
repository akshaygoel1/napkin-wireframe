import type { CSSProperties, ReactNode } from "react";
import type { ElementProps, ElementType } from "../types";
import { deepen, readableOn, soften } from "../utils/color";
import { Glyph, INK, MUTED, PAPER, SketchArrow, SketchCircle, SketchLine, SketchRect, SketchSegment, SOFT, SOFTER, Squiggles, STICKY } from "./Sketch";

interface WProps {
  type: ElementType;
  w: number;
  h: number;
  p: ElementProps;
  seed: number;
}

function rnd(seed: number, i: number) {
  const x = Math.sin(seed * 1234.567 + i * 98.76) * 10000;
  return x - Math.floor(x);
}

function initials(text?: string) {
  if (!text) return "";
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Row({ children, style, className }: { children?: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={`wf-row ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

function Col({ children, style, className }: { children?: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={`wf-col ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

const Label = ({ children, className, style }: { children?: ReactNode; className?: string; style?: CSSProperties }) => (
  <span className={`wf-t ${className ?? ""}`} style={style}>
    {children}
  </span>
);

function ImagePlaceholder({ w, h, seed, r = 3, style }: { w: number; h: number; seed: number; r?: number; style?: CSSProperties }) {
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, ...style }}>
      <SketchRect w={w} h={h} r={r} fill={PAPER} seed={seed} />
      <SketchSegment x1={3} y1={3} x2={w - 3} y2={h - 3} seed={seed + 1} strokeWidth={1.2} />
      <SketchSegment x1={w - 3} y1={3} x2={3} y2={h - 3} seed={seed + 2} strokeWidth={1.2} />
    </div>
  );
}

function MiniButton({ w, h, label, filled, seed }: { w: number; h: number; label: string; filled?: boolean; seed: number }) {
  return (
    <div style={{ position: "relative", width: w, height: h, flex: "none" }}>
      <SketchRect w={w} h={h} r={Math.min(8, h / 2)} fill={filled ? INK : PAPER} seed={seed} strokeWidth={1.3} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: filled ? "#fff" : INK,
          fontSize: Math.min(12.5, h * 0.38),
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function Wireframe({ type, w, h, p, seed }: WProps) {
  switch (type) {
    case "button": {
      const variant = p.variant ?? "filled";
      const tint = p.color;
      const filled = variant === "filled";
      const elevated = variant === "elevated";
      const soft = variant === "tonal";
      const bg =
        filled || (elevated && tint)
          ? (tint ?? INK)
          : soft
            ? (tint ? soften(tint) : SOFT)
            : PAPER;
      const text = filled
        ? (tint ? readableOn(bg) : "#FFFFFF")
        : soft && tint
          ? deepen(tint, 0.2)
          : tint
            ? (elevated ? readableOn(bg) : tint)
            : INK;
      const stroke = variant === "outlined" || variant === "text" ? (tint ?? INK) : INK;
      const fs = Math.max(11, Math.min(15, h * 0.33));
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", opacity: p.state === "disabled" ? 0.4 : 1 }}>
          {variant !== "text" && (
            <SketchRect
              w={w}
              h={h}
              r={Math.min(12, h * 0.3)}
              fill={bg}
              stroke={stroke}
              seed={seed}
              strokeWidth={variant === "text" ? 0 : 1.5}
              style={variant === "elevated" ? { transform: "translate(-1.5px,-1.5px)" } : undefined}
            />
          )}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: text, padding: "0 12px" }}>
            {p.icon && <Glyph name={p.icon} size={Math.min(19, h * 0.44)} color={text} />}
            <span className="wf-label" style={{ fontSize: fs, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.label || "Button"}
            </span>
          </div>
        </div>
      );
    }

    case "icon-button": {
      const v = p.variant ?? "standard";
      const tint = p.color;
      const fill = tint
        ? v === "filled" ? tint : v === "tonal" ? soften(tint) : PAPER
        : v === "filled" ? INK : v === "tonal" ? SOFT : PAPER;
      const color = tint
        ? v === "filled" ? readableOn(tint) : v === "tonal" ? deepen(tint, 0.2) : tint
        : v === "filled" ? "#fff" : INK;
      const stroke = tint && (v === "standard" || v === "outlined") ? tint : INK;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", opacity: p.state === "disabled" ? 0.4 : 1 }}>
          <SketchRect w={w} h={h} r={Math.min(14, h * 0.32)} fill={fill} stroke={stroke} seed={seed} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Glyph name={p.icon ?? "favorite"} size={Math.min(24, w * 0.48)} color={color} />
          </div>
        </div>
      );
    }

    case "fab": {
      const tint = p.color;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={Math.min(w, h) / 2} fill={tint ?? INK} seed={seed} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Glyph name={p.icon ?? "add"} size={Math.min(28, w * 0.46)} color={tint ? readableOn(tint) : "#fff"} />
          </div>
        </div>
      );
    }

    case "extended-fab": {
      const tint = p.color;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={Math.min(18, h / 2)} fill={tint ?? INK} seed={seed} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: tint ? readableOn(tint) : "#fff", padding: "0 16px" }}>
            <Glyph name={p.icon ?? "add"} size={Math.min(22, h * 0.4)} color={tint ? readableOn(tint) : "#fff"} />
            <span className="wf-label" style={{ fontSize: Math.min(14, h * 0.28), fontWeight: 700, whiteSpace: "nowrap" }}>
              {p.label || "New"}
            </span>
          </div>
        </div>
      );
    }

    case "split-button": {
      const tint = p.color;
      const ink = tint ?? INK;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={Math.min(10, h * 0.3)} fill={PAPER} stroke={ink} seed={seed} />
          <div style={{ position: "absolute", top: 4, bottom: 4, right: 42, width: 1.2, background: ink, opacity: 0.7 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px", paddingRight: 50 }}>
            <span className="wf-label" style={{ fontSize: Math.min(14, h * 0.32), fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: ink }}>
              {p.label || "Split button"}
            </span>
          </div>
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 8, width: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Glyph name={p.icon ?? "arrow_drop_down"} size={20} color={ink} />
          </div>
        </div>
      );
    }

    case "segmented-button":
    case "button-group": {
      const items = p.items?.length ? p.items : ["One", "Two", "Three"];
      const selected = type === "segmented-button" ? p.selectedIndex ?? 0 : -1;
      const tint = p.color;
      const activeBg = tint ? soften(tint) : SOFT;
      const activeInk = tint ? deepen(tint, 0.22) : INK;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={Math.min(10, h * 0.3)} fill={PAPER} seed={seed} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "stretch" }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  borderLeft: i > 0 ? `1.2px solid ${INK}` : "none",
                  background: i === selected ? activeBg : "transparent",
                  borderRadius: 8,
                  margin: 2,
                  fontSize: Math.max(9, Math.min(12.5, h * 0.29)),
                  fontWeight: i === selected ? 700 : 400,
                  color: i === selected ? activeInk : INK,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {i === selected && <Glyph name="check" size={Math.min(14, h * 0.33)} color={activeInk} />}
                <span className="wf-label">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "badge": {
      const tint = p.color;
      if (p.variant === "dot") {
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <div style={{ position: "absolute", left: w / 2 - 5, top: h / 2 - 5, width: 10, height: 10, borderRadius: 10, background: tint ?? INK }} />
          </div>
        );
      }
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={h / 2} fill={tint ?? INK} seed={seed} strokeWidth={1.2} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: tint ? readableOn(tint) : "#fff", fontSize: Math.max(9, Math.min(12, h * 0.46)), fontWeight: 700 }}>
            {p.label ?? "12"}
          </div>
        </div>
      );
    }

    case "progress": {
      const tint = p.color;
      if (p.variant === "circular") {
        const d = Math.min(w, h);
        const val = Math.max(0, Math.min(100, p.value ?? 60));
        const r = d / 2 - 3;
        const c = 2 * Math.PI * r;
        return (
          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`}>
              <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={SOFT} strokeWidth={4} />
              <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={tint ?? INK} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${(c * val) / 100} ${c}`} transform={`rotate(-90 ${d / 2} ${d / 2})`} />
            </svg>
            <span className="wf-label" style={{ position: "absolute", fontSize: Math.max(9, d * 0.18), fontWeight: 700, color: tint ? deepen(tint, 0.15) : undefined }}>{val}%</span>
          </div>
        );
      }
      const val = Math.max(0, Math.min(100, p.value ?? 60));
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: Math.max(6, h), top: (h - Math.max(6, h)) / 2 }}>
            <SketchRect w={w} h={Math.max(6, h)} r={h / 2} fill={SOFT} seed={seed} strokeWidth={1.1} />
            <div style={{ position: "absolute", left: 0, top: 0, width: `${val}%`, height: "100%" }}>
              <SketchRect w={(w * val) / 100} h={Math.max(6, h)} r={h / 2} fill={tint ?? INK} seed={seed + 2} strokeWidth={1.1} />
            </div>
          </div>
        </div>
      );
    }

    case "snackbar": {
      const tint = p.color;
      const text = tint ? readableOn(tint) : "#fff";
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={7} fill={tint ?? INK} seed={seed} strokeWidth={1.2} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", color: text }}>
            {p.icon && <Glyph name={p.icon} size={Math.min(19, h * 0.36)} color={text} />}
            <span className="wf-label" style={{ flex: 1, fontSize: Math.min(13, h * 0.26), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.label || "Draft saved"}
            </span>
            <span className="wf-label" style={{ fontSize: Math.min(12.5, h * 0.24), fontWeight: 700, textDecoration: "underline", color: text }}>
              {p.icon2 || "Undo"}
            </span>
          </div>
        </div>
      );
    }

    case "tooltip": {
      const tint = p.color;
      const text = tint ? readableOn(tint) : "#fff";
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h - 6} r={6} fill={tint ?? INK} seed={seed} strokeWidth={1.2} />
          <svg width={12} height={8} style={{ position: "absolute", left: 18, bottom: 0 }} viewBox="0 0 12 8">
            <path d="M0 0 L12 0 L6 8 Z" fill={tint ?? INK} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h - 6, display: "flex", alignItems: "center", justifyContent: "center", color: text, fontSize: Math.min(12, h * 0.28), padding: "0 8px" }}>
            {p.label || "Tooltip"}
          </div>
        </div>
      );
    }

    case "card": {
      const imageH = h > 100 ? Math.min(h * 0.56, h - 56) : 0;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={12} fill={p.variant === "filled" ? SOFT : PAPER} seed={seed} />
          {imageH > 0 && <ImagePlaceholder w={w - 2} h={imageH} seed={seed + 1} r={10} style={{ left: 1, top: 1 }} />}
          <div style={{ position: "absolute", left: 14, right: 14, top: imageH + (imageH ? 10 : 14) }}>
            <div className="wf-label" style={{ fontSize: Math.min(15.5, h * 0.13), fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.label || "Card title"}
            </div>
            {h > 110 && <div style={{ position: "relative", height: 26, marginTop: 6 }}><Squiggles w={w - 28} h={22} lines={2} seed={seed + 4} /></div>}
          </div>
        </div>
      );
    }

    case "carousel": {
      const gap = 10;
      const cw = (w - gap - 4) / 2;
      const chh = h - 20;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: cw, height: chh }}>
            <ImagePlaceholder w={cw} h={chh} seed={seed} r={8} />
          </div>
          <div style={{ position: "absolute", left: cw + gap, top: 0, width: cw, height: chh }}>
            <ImagePlaceholder w={cw} h={chh} seed={seed + 3} r={8} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 1, display: "flex", justifyContent: "center", gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 6, background: i === 0 ? INK : SOFT, border: i === 0 ? "none" : `1px solid ${INK}` }} />
            ))}
          </div>
        </div>
      );
    }

    case "list": {
      const items = p.items?.length ? p.items : ["List item one", "List item two", "List item three"];
      const rows = Math.max(1, Math.min(items.length, Math.floor(h / 48)));
      const rowH = h / rows;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * rowH, height: rowH }}>
              {i > 0 && <SketchLine w={w} h={2} seed={seed + i + 5} strokeWidth={1} />}
              <div style={{ position: "absolute", left: 10, top: rowH / 2 - 16 }}>
                <SketchCircle w={32} h={32} seed={seed + i} fill={SOFTER} strokeWidth={1.2} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {initials(items[i])}
                </div>
              </div>
              <div style={{ position: "absolute", left: 54, right: 28, top: rowH / 2 - 17 }}>
                <div className="wf-label" style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {items[i]}
                </div>
                <div style={{ position: "relative", height: 12, marginTop: 5 }}>
                  <Squiggles w={Math.min(w - 90, 170)} h={9} lines={1} seed={seed + i + 9} />
                </div>
              </div>
              <Glyph name="chevron_right" size={18} color={MUTED} style={{ position: "absolute", right: 8, top: rowH / 2 - 9 }} />
            </div>
          ))}
        </div>
      );
    }

    case "list-item": {
      const compact = h < 48;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", left: compact ? 0 : 10, top: compact ? 0 : h / 2 - 16, width: compact ? 0 : 32, height: compact ? 0 : 32 }}>
            {!compact && <SketchCircle w={32} h={32} seed={seed} fill={SOFTER} strokeWidth={1.2} />}
            {!compact && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{initials(p.label)}</div>}
          </div>
          <div style={{ position: "absolute", left: compact ? 0 : 52, right: 28, top: compact ? 0 : 8, bottom: compact ? 0 : 8, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="wf-label" style={{ fontSize: 13, fontWeight: compact ? 400 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.label || "List item"}
            </div>
            {!compact && (
              <div style={{ position: "relative", height: 11, marginTop: 4 }}>
                <Squiggles w={Math.min(w - 110, 190)} h={8} lines={1} seed={seed + 1} />
              </div>
            )}
          </div>
          <Glyph name="chevron_right" size={18} color={MUTED} style={{ position: "absolute", right: 4, top: h / 2 - 9 }} />
        </div>
      );
    }

    case "divider":
    case "line":
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
          <SketchLine w={w} h={Math.max(2, h)} seed={seed} strokeWidth={1.3} />
        </div>
      );

    case "dialog": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={14} fill={PAPER} seed={seed} />
          <div style={{ position: "absolute", left: 20, right: 20, top: 18 }}>
            <div className="wf-label" style={{ fontSize: 16, fontWeight: 700 }}>{p.label || "Save changes?"}</div>
            <div style={{ position: "relative", height: Math.max(28, h - 100), marginTop: 12 }}>
              <Squiggles w={w - 40} h={Math.max(28, h - 100)} lines={3} seed={seed + 1} />
            </div>
          </div>
          <div style={{ position: "absolute", right: 16, bottom: 14, display: "flex", gap: 8 }}>
            <MiniButton w={70} h={32} label={p.items?.[0] ?? "Cancel"} seed={seed + 8} />
            <MiniButton w={66} h={32} label={p.items?.[1] ?? "Save"} seed={seed + 9} filled />
          </div>
        </div>
      );
    }

    case "bottom-sheet": {
      const items = p.items?.length ? p.items : ["Category", "Price", "Rating"];
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={16} fill={PAPER} seed={seed} />
          <div style={{ position: "absolute", top: 8, left: w / 2 - 20, width: 40, height: 4, borderRadius: 4, background: INK, opacity: 0.55 }} />
          <div className="wf-label" style={{ position: "absolute", left: 18, top: 22, fontSize: 15, fontWeight: 700 }}>{p.label || "Filters"}</div>
          <div style={{ position: "absolute", left: 18, right: 18, top: 52, bottom: 18 }}>
            {items.slice(0, 3).map((it, i) => (
              <div key={i} style={{ position: "relative", height: 38, display: "flex", alignItems: "center", borderBottom: i < 2 ? `1px solid ${SOFT}` : "none", gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.3px solid ${INK}`, background: i === 0 ? INK : "transparent" }} />
                <span className="wf-label" style={{ fontSize: 12.5 }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "side-sheet": {
      const items = p.items?.length ? p.items : ["Profile", "Notifications", "Billing", "Team"];
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={4} fill={PAPER} seed={seed} />
          <div className="wf-label" style={{ position: "absolute", left: 18, top: 16, fontSize: 15, fontWeight: 700 }}>{p.label || "Settings"}</div>
          <Glyph name="close" size={18} style={{ position: "absolute", right: 14, top: 16 }} />
          <SketchLine w={w} h={2} seed={seed + 1} style={{ top: 46, left: 0 }} />
          <div style={{ position: "absolute", left: 12, right: 12, top: 52 }}>
            {items.map((it, i) => (
              <div key={i} style={{ position: "relative", height: 40, display: "flex", alignItems: "center", gap: 10, borderRadius: 8, background: i === 0 ? SOFTER : "transparent", padding: "0 8px" }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.2px solid ${INK}`, opacity: 0.7 }} />
                <span className="wf-label" style={{ fontSize: 12.5, fontWeight: i === 0 ? 700 : 400 }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "scroll-view": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={10} fill={PAPER} seed={seed} />
          <div style={{ position: "absolute", left: 10, right: 22, top: 10, bottom: 10, overflow: "hidden" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ position: "relative", height: 54, borderBottom: i < 4 ? `1px solid ${SOFT}` : "none" }}>
                <div style={{ position: "absolute", left: 0, top: 10, width: 34, height: 34, border: `1.2px solid ${INK}`, borderRadius: 6, background: SOFTER }} />
                <div style={{ position: "absolute", left: 46, right: 8, top: 13 }}>
                  <div style={{ height: 6, width: "52%", background: INK, borderRadius: 3, opacity: 0.6 }} />
                  <div style={{ position: "relative", height: 14, marginTop: 5 }}>
                    <Squiggles w={Math.min(w - 100, 200)} h={11} lines={1} seed={seed + i} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", right: 7, top: 10, bottom: 10, width: 5, borderRadius: 5, background: SOFT }} />
          <div style={{ position: "absolute", right: 7, top: 10, width: 5, height: h * 0.36, borderRadius: 5, background: INK, opacity: 0.55 }} />
        </div>
      );
    }

    case "app-bar": {
      const centered = p.variant === "center";
      const trailing = [p.icon2, p.icon3, p.icon4].filter(Boolean) as string[];
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", inset: 0, background: PAPER }} />
          <SketchLine w={w} h={2} seed={seed + 3} strokeWidth={1.1} style={{ top: h - 1 }} />
          {p.icon && <Glyph name={p.icon} size={22} style={{ position: "absolute", left: 18, top: h / 2 - 11 }} />}
          <div
            className="wf-label"
            style={{
              position: "absolute",
              left: centered ? 0 : p.icon ? 56 : 18,
              right: trailing.length ? 102 : 18,
              top: 0,
              height: h,
              display: "flex",
              alignItems: "center",
              justifyContent: centered ? "center" : "flex-start",
              fontSize: 17.5,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.label || "App title"}
          </div>
          <div style={{ position: "absolute", right: 12, top: h / 2 - 12, display: "flex", gap: 4 }}>
            {trailing.map((ic, i) => (
              <div key={i} style={{ width: 34, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Glyph name={ic} size={21} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "bottom-app-bar": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", inset: 0, background: SOFTER }} />
          <SketchLine w={w} h={2} seed={seed + 2} strokeWidth={1.1} style={{ top: 0 }} />
          <Glyph name={p.icon ?? "menu"} size={22} style={{ position: "absolute", left: 20, top: h / 2 - 11 }} />
          <div style={{ position: "absolute", right: 20, top: h / 2 - 11, display: "flex", gap: 16 }}>
            <Glyph name={p.icon2 ?? "search"} size={22} />
            <Glyph name={p.icon3 ?? "notifications"} size={22} />
          </div>
        </div>
      );
    }

    case "search-bar": {
      const outlined = p.variant === "outlined";
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={h / 2} fill={outlined ? PAPER : SOFT} stroke={INK} strokeWidth={1.4} seed={seed} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 10 }}>
            <Glyph name={p.icon ?? "search"} size={Math.min(21, h * 0.42)} color={MUTED} />
            <span className="wf-label" style={{ fontSize: Math.min(14, h * 0.29), color: MUTED, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.placeholder || p.label || "Search"}
            </span>
            {p.icon2 && <Glyph name={p.icon2} size={Math.min(20, h * 0.4)} color={MUTED} />}
          </div>
        </div>
      );
    }

    case "nav-bar": {
      const items = p.items?.length ? p.items : ["Home", "Explore", "Saved", "You"];
      const icons = p.icons?.length ? p.icons : ["home", "explore", "bookmark", "person"];
      const sel = p.selectedIndex ?? 0;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", inset: 0, background: PAPER }} />
          <SketchLine w={w} h={2} seed={seed + 1} strokeWidth={1.1} style={{ top: 0 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
            {items.map((item, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 56, height: 30, borderRadius: 16, background: i === sel ? SOFT : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Glyph name={icons[i] ?? "circle"} size={21} fill={i === sel} />
                </div>
                <span className="wf-label" style={{ fontSize: 9.5, fontWeight: i === sel ? 700 : 400, whiteSpace: "nowrap" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "nav-rail": {
      const items = p.items?.length ? p.items : ["Home", "Library", "Insights", "Settings"];
      const icons = p.icons?.length ? p.icons : ["home", "folder", "insert_chart", "settings"];
      const sel = p.selectedIndex ?? 0;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", inset: 0, background: PAPER }} />
          <SketchLine w={w} h={2} seed={seed + 2} strokeWidth={1} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 14, display: "flex", justifyContent: "center" }}>
            <Glyph name="menu" size={21} />
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ position: "absolute", left: 8, right: 8, top: 66 + i * 66, height: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: i === sel ? SOFT : "transparent", borderRadius: 16 }}>
              <Glyph name={icons[i] ?? "circle"} size={21} fill={i === sel} />
              <span className="wf-label" style={{ fontSize: 9, fontWeight: i === sel ? 700 : 400 }}>{item}</span>
            </div>
          ))}
        </div>
      );
    }

    case "nav-drawer": {
      const items = p.items?.length ? p.items : ["Home", "Projects", "Shared", "Archive"];
      const icons = p.icons?.length ? p.icons : ["home", "folder", "group", "archive"];
      const sel = p.selectedIndex ?? 0;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={2} fill={PAPER} seed={seed} />
          <div className="wf-label" style={{ position: "absolute", left: 18, top: 16, fontSize: 16, fontWeight: 700 }}>{p.label || "Napkin"}</div>
          <div style={{ position: "absolute", left: 18, top: 42, height: 10, width: 120 }}>
            <Squiggles w={120} h={9} lines={1} seed={seed + 2} />
          </div>
          <div style={{ position: "absolute", left: 10, right: 10, top: 70 }}>
            {items.map((it, i) => (
              <div key={i} style={{ position: "relative", height: 42, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", background: i === sel ? SOFTER : "transparent", borderRadius: 20 }}>
                <Glyph name={icons[i] ?? "circle"} size={19} fill={i === sel} />
                <span className="wf-label" style={{ fontSize: 12.5, fontWeight: i === sel ? 700 : 400 }}>{it}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <SketchCircle w={26} h={26} seed={seed + 7} fill={SOFTER} />
            <div style={{ position: "relative", width: 92, height: 10 }}>
              <Squiggles w={92} h={9} lines={1} seed={seed + 8} />
            </div>
          </div>
        </div>
      );
    }

    case "tabs": {
      const items = p.items?.length ? p.items : ["Overview", "Activity", "Settings"];
      const sel = p.selectedIndex ?? 0;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchLine w={w} h={2} seed={seed + 1} strokeWidth={1} style={{ top: h - 1 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            {items.map((it, i) => (
              <div key={i} style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="wf-label" style={{ fontSize: 12.5, fontWeight: i === sel ? 700 : 400 }}>{it}</span>
                {i === sel && <div style={{ position: "absolute", left: 16, right: 16, bottom: 0, height: 2.2, background: INK, borderRadius: 2 }} />}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "toolbar": {
      const icons = p.icons?.length ? p.icons : ["format_bold", "format_italic", "format_underlined", "link"];
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={10} fill={PAPER} seed={seed} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 10px" }}>
            {icons.map((ic, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: i === 0 ? SOFTER : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Glyph name={ic} size={18} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "checkbox": {
      const tint = p.color;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ position: "relative", width: 20, height: 20, flex: "none" }}>
            <SketchRect w={20} h={20} r={3.5} fill={p.checked ? (tint ?? INK) : PAPER} seed={seed} strokeWidth={1.3} />
            {p.checked && <Glyph name="check" size={16} color={tint ? readableOn(tint) : "#fff"} style={{ position: "absolute", left: 2, top: 2 }} />}
          </div>
          <span className="wf-label" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label || "Checkbox"}</span>
        </div>
      );
    }

    case "radio": {
      const tint = p.color;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ position: "relative", width: 20, height: 20, flex: "none" }}>
            <SketchCircle w={20} h={20} fill={PAPER} seed={seed} strokeWidth={1.3} />
            {p.checked && <div style={{ position: "absolute", left: 5.5, top: 5.5, width: 9, height: 9, borderRadius: 9, background: tint ?? INK }} />}
          </div>
          <span className="wf-label" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label || "Option"}</span>
        </div>
      );
    }

    case "switch": {
      const on = p.checked !== false;
      const tint = p.color;
      const sw = 42;
      const sh = 22;
      const sx = Math.min(w - sw, Math.max(0, w * 0.55));
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
          <span className="wf-label" style={{ fontSize: 13, maxWidth: sx - 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label || "Switch"}</span>
          <div style={{ position: "absolute", left: sx, top: h / 2 - sh / 2, width: sw, height: sh }}>
            <SketchRect w={sw} h={sh} r={sh / 2} fill={on ? (tint ?? INK) : PAPER} seed={seed} strokeWidth={1.3} />
            <div style={{ position: "absolute", left: on ? sw - 18 : 3, top: 3, width: 16, height: 16, borderRadius: 8, background: on ? (tint ? readableOn(tint) : "#fff") : (tint ?? INK) }} />
          </div>
        </div>
      );
    }

    case "chips": {
      const items = p.items?.length ? p.items : ["Filter", "Popular", "Nearby"];
      const tint = p.color;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
          {items.map((it, i) => {
            const on = i === (p.selectedIndex ?? 0);
            const cw = Math.min(w, 28 + it.length * 7.2);
            const chipInk = on && tint ? deepen(tint, 0.22) : INK;
            return (
              <div key={i} style={{ position: "relative", height: h, width: cw, flex: "none", borderRadius: h / 2 }}>
                <SketchRect w={cw} h={h} r={h / 2} fill={on ? (tint ? soften(tint) : SOFT) : PAPER} stroke={on && tint ? tint : INK} seed={seed + i} strokeWidth={1.25} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "0 8px", color: chipInk }}>
                  {on && <Glyph name="check" size={Math.min(14, h * 0.4)} color={chipInk} />}
                  <span className="wf-label" style={{ fontSize: Math.min(12, h * 0.34), fontWeight: on ? 700 : 400, whiteSpace: "nowrap" }}>{it}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case "menu": {
      const items = p.items?.length ? p.items : ["Profile", "Settings", "Help", "Sign out"];
      const rowH = Math.max(32, Math.min(46, (h - 12) / items.length));
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={9} fill={PAPER} seed={seed} />
          <div style={{ position: "absolute", left: 6, right: 6, top: 6 }}>
            {items.map((it, i) => (
              <div key={i} style={{ position: "relative", height: rowH, display: "flex", alignItems: "center", borderRadius: 6, background: i === 0 ? SOFTER : "transparent", padding: "0 10px" }}>
                <span className="wf-label" style={{ fontSize: 12.5, fontWeight: i === 0 ? 700 : 400 }}>{it}</span>
                {i === 0 && <Glyph name="check" size={15} style={{ position: "absolute", right: 10 }} />}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "slider": {
      const val = Math.max(0, Math.min(100, p.value ?? 60));
      const trackW = w - 42;
      const y = h / 2 + 2;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {h >= 34 && <span className="wf-label" style={{ position: "absolute", left: 0, top: 0, fontSize: 10.5, color: MUTED }}>{p.label || "Slider"}</span>}
          <div style={{ position: "absolute", left: 6, top: y - 1, width: trackW, height: 2.4, background: SOFT, borderRadius: 2 }} />
          <div style={{ position: "absolute", left: 6, top: y - 1, width: (trackW * val) / 100, height: 2.4, background: INK, borderRadius: 2 }} />
          <SketchCircle w={16} h={16} seed={seed} fill={PAPER} style={{ position: "absolute", left: 6 + (trackW * val) / 100 - 8, top: y - 8, width: 16, height: 16 }} />
          <span className="wf-label" style={{ position: "absolute", right: 0, top: y - 9, fontSize: 10.5, color: MUTED }}>{val}</span>
        </div>
      );
    }

    case "text-field": {
      const outlined = (p.variant ?? "outlined") === "outlined";
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {outlined ? (
            <SketchRect w={w} h={h} r={8} fill={PAPER} seed={seed} strokeWidth={1.4} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: SOFT, borderRadius: 6 }}>
              <SketchLine w={w} h={2} seed={seed + 1} strokeWidth={1.3} style={{ top: h - 2 }} />
            </div>
          )}
          <div style={{ position: "absolute", left: 13, top: outlined ? 9 : 8 }}>
            <span className="wf-label" style={{ fontSize: 9.5, color: MUTED, background: outlined ? PAPER : SOFT, padding: "0 3px" }}>
              {p.label || "Label"}
            </span>
          </div>
          <div style={{ position: "absolute", left: p.icon ? 40 : 13, right: 14, top: 26, display: "flex", alignItems: "center", gap: 8 }}>
            {p.icon && <Glyph name={p.icon} size={18} color={MUTED} />}
            <span className="wf-label" style={{ fontSize: 13, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.placeholder || "Input text"}
            </span>
          </div>
          <div style={{ position: "absolute", left: 13, right: 13, bottom: 6, height: 1, background: INK, opacity: outlined ? 0.25 : 0.5 }} />
        </div>
      );
    }

    case "text-area": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={8} fill={PAPER} seed={seed} strokeWidth={1.4} />
          <span className="wf-label" style={{ position: "absolute", left: 11, top: -2, fontSize: 9.5, color: MUTED, background: PAPER, padding: "0 4px" }}>{p.label || "Message"}</span>
          <span className="wf-label" style={{ position: "absolute", left: 13, top: 16, fontSize: 13, color: MUTED }}>{p.placeholder || "Write something…"}</span>
          <div style={{ position: "absolute", left: 13, right: 24, top: 40, height: Math.max(10, h - 58) }}>
            <Squiggles w={w - 40} h={Math.max(10, h - 58)} lines={Math.min(3, Math.max(1, Math.floor((h - 58) / 13)))} seed={seed + 3} />
          </div>
          <SketchSegment x1={w - 20} y1={h - 6} x2={w - 6} y2={h - 20} seed={seed + 4} strokeWidth={1.1} opacity={0.6} />
          <SketchSegment x1={w - 13} y1={h - 6} x2={w - 6} y2={h - 13} seed={seed + 5} strokeWidth={1.1} opacity={0.6} />
        </div>
      );
    }

    case "text": {
      const v = p.variant ?? "body";
      const sizes: Record<string, number> = { h1: 28, h2: 22, h3: 17, body: 15, muted: 14, link: 14, label: 12 };
      const weights: Record<string, number> = { h1: 700, h2: 700, h3: 700, body: 400, muted: 400, link: 700, label: 700 };
      const color = p.color ?? (v === "muted" ? MUTED : INK);
      return (
        <div
          className="wf-label"
          style={{
            width: "100%",
            height: "100%",
            fontSize: sizes[v] ?? 15,
            fontWeight: weights[v] ?? 400,
            lineHeight: v.startsWith("h") ? 1.16 : 1.35,
            color,
            textAlign: p.align ?? "left",
            textDecoration: v === "link" ? "underline" : "none",
            textDecorationThickness: 1.5,
            textUnderlineOffset: 3,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
          }}
        >
          {p.label || "Text"}
        </div>
      );
    }

    case "paragraph": {
      const lines = p.lines ?? Math.max(2, Math.round(h / 14));
      return <Squiggles w={w} h={h} lines={lines} seed={seed} />;
    }

    case "image":
      return <ImagePlaceholder w={w} h={h} seed={seed} r={4} />;

    case "avatar": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchCircle w={w} h={h} fill={SOFTER} seed={seed} strokeWidth={1.4} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {p.label ? (
              <span className="wf-label" style={{ fontSize: Math.max(12, w * 0.3), fontWeight: 700 }}>{initials(p.label)}</span>
            ) : (
              <Glyph name="person" size={Math.max(20, w * 0.55)} />
            )}
          </div>
        </div>
      );
    }

    case "video": {
      const ph = Math.max(24, h * 0.14);
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={8} fill={SOFTER} seed={seed} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: ph, background: INK }}>
            <div style={{ position: "absolute", left: 8, right: 8, top: ph / 2 - 1, height: 2, background: "rgba(255,255,255,.25)" }} />
            <div style={{ position: "absolute", left: 8, top: ph / 2 - 1, width: "38%", height: 2, background: "#fff" }} />
            <span className="wf-label" style={{ position: "absolute", right: 9, top: ph / 2 - 6, fontSize: 9, color: "#fff" }}>{p.label || "0:24"}</span>
          </div>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-58%)", width: 46, height: 46 }}>
            <SketchCircle w={46} h={46} fill={PAPER} seed={seed + 2} />
            <svg width={16} height={18} viewBox="0 0 16 18" style={{ position: "absolute", left: 17, top: 14 }}>
              <path d="M0 0 L16 9 L0 18 Z" fill={INK} />
            </svg>
          </div>
        </div>
      );
    }

    case "map": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={6} fill="#F4F2ED" seed={seed} />
          <SketchRect w={w * 0.24} h={h * 0.2} r={2} fill={PAPER} seed={seed + 1} style={{ left: 12, top: 14 }} />
          <SketchRect w={w * 0.2} h={h * 0.16} r={2} fill={PAPER} seed={seed + 2} style={{ left: w * 0.66, top: h * 0.18 }} />
          <SketchRect w={w * 0.18} h={h * 0.24} r={2} fill={PAPER} seed={seed + 3} style={{ left: w * 0.18, top: h * 0.64 }} />
          <SketchSegment x1={-10} y1={h * 0.55} x2={w + 10} y2={h * 0.75} stroke="#fff" strokeWidth={11} seed={seed + 4} />
          <SketchSegment x1={-10} y1={h * 0.55} x2={w + 10} y2={h * 0.75} stroke={MUTED} strokeWidth={1} seed={seed + 4} opacity={0.5} />
          <SketchSegment x1={w * 0.55} y1={-10} x2={w * 0.35} y2={h + 10} stroke="#fff" strokeWidth={9} seed={seed + 5} />
          <SketchSegment x1={w * 0.55} y1={-10} x2={w * 0.35} y2={h + 10} stroke={MUTED} strokeWidth={1} seed={seed + 5} opacity={0.5} />
          <div style={{ position: "absolute", left: "50%", top: "38%", transform: "translate(-50%,-50%)" }}>
            <Glyph name="place" size={30} fill />
          </div>
        </div>
      );
    }

    case "chart": {
      const padL = 34;
      const padB = 24;
      const padT = 38;
      const chartW = w - padL - 14;
      const chartH = h - padB - padT;
      const n = 6;
      const bw = Math.max(10, (chartW - (n - 1) * 10) / n);
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={12} fill={PAPER} seed={seed} />
          <span className="wf-label" style={{ position: "absolute", left: 16, top: 13, fontSize: 13, fontWeight: 700 }}>{p.label || "Chart"}</span>
          <div style={{ position: "absolute", left: 16, top: 32, width: 40, height: 8 }}>
            <Squiggles w={40} h={7} lines={1} seed={seed + 8} />
          </div>
          <SketchLine w={chartW + 8} h={1} seed={seed + 2} strokeWidth={1} style={{ left: padL - 4, top: padT + chartH }} />
          <SketchLine w={1} h={chartH} seed={seed + 3} strokeWidth={1} style={{ left: padL, top: padT }} />
          {[0.25, 0.5, 0.75, 1].map((f, i) => (
            <div key={i} style={{ position: "absolute", left: padL, top: padT + chartH * (1 - f), width: chartW, height: 1, borderTop: "1px dashed rgba(38,35,43,.14)" }} />
          ))}
          {Array.from({ length: n }).map((_, i) => {
            const bh = chartH * (0.28 + rnd(seed, i) * 0.66);
            return (
              <div key={i} style={{ position: "absolute", left: padL + 4 + i * (bw + 10), top: padT + chartH - bh, width: bw, height: bh }}>
                <SketchRect w={bw} h={bh} r={3} fill={i === 4 ? INK : SOFT} seed={seed + 10 + i} strokeWidth={1.2} />
              </div>
            );
          })}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <span key={d} className="wf-label" style={{ position: "absolute", left: padL + 2 + i * (bw + 10), top: h - 18, width: bw, textAlign: "center", fontSize: 8.5, color: MUTED }}>{d}</span>
          ))}
        </div>
      );
    }

    case "table": {
      const cols = p.items?.length ? p.items : ["Name", "Status", "Date"];
      const headerH = 32;
      const rows = Math.max(2, Math.floor((h - headerH) / 34));
      const cw = w / cols.length;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <SketchRect w={w} h={h} r={10} fill={PAPER} seed={seed} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: headerH, background: SOFTER, borderTopLeftRadius: 9, borderTopRightRadius: 9 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: headerH }}>
            {cols.map((c, i) => (
              <span key={i} className="wf-label" style={{ position: "absolute", left: i * cw + 12, top: 10, width: cw - 20, fontSize: 10, fontWeight: 700, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.toUpperCase()}
              </span>
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ position: "absolute", left: 0, right: 0, top: headerH + r * 34, height: 34, borderTop: `1px solid ${SOFT}` }}>
              {cols.map((_, c) => (
                <div key={c} style={{ position: "absolute", left: c * cw + 12, top: 11, width: Math.max(20, cw - 28), height: 10 }}>
                  <Squiggles w={Math.max(20, cw - 28)} h={9} lines={1} seed={seed + r * 5 + c} />
                </div>
              ))}
            </div>
          ))}
          <SketchLine w={w} h={1} seed={seed + 78} strokeWidth={1} style={{ top: headerH }} />
        </div>
      );
    }

    case "rectangle":
      return <SketchRect w={w} h={h} r={2} fill={p.color ?? PAPER} seed={seed} />;

    case "rounded-rect":
      return <SketchRect w={w} h={h} r={Math.min(18, Math.min(w, h) * 0.25)} fill={p.color ?? PAPER} seed={seed} />;

    case "circle":
      return <SketchCircle w={w} h={h} fill={p.color ?? PAPER} seed={seed} />;

    case "arrow":
      return <SketchArrow w={w} h={h} seed={seed} />;

    case "rating": {
      const val = Math.max(0, Math.min(5, p.value ?? 5));
      const starSize = Math.min(18, h);
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 1.5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Glyph key={i} name="star" size={starSize} fill={i < Math.round(val)} color={i < Math.round(val) ? INK : MUTED} />
          ))}
          <span className="wf-label" style={{ fontSize: Math.min(11.5, h * 0.5), color: MUTED, marginLeft: 5 }}>({p.label || "0"})</span>
        </div>
      );
    }

    case "icon": {
      const s = Math.min(w, h, p.value ? p.value : Math.min(w, h));
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Glyph name={p.icon ?? "star"} size={Math.min(w, h) * 0.82} fill={p.iconFill} weight={p.iconWeight ?? 400} glyphStyle={p.iconStyle ?? "rounded"} />
        </div>
      );
    }

    case "sticky": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", transform: "rotate(-0.7deg)" }}>
          <SketchRect w={w} h={h} r={2} fill={STICKY} seed={seed} strokeWidth={1.3} />
          <svg width={18} height={18} viewBox="0 0 18 18" style={{ position: "absolute", right: 1, bottom: 1 }}>
            <path d="M0 18 L18 0 L18 18 Z" fill={PAPER} stroke={INK} strokeWidth={1} />
          </svg>
          <div
            className="wf-label"
            style={{
              position: "absolute",
              inset: "13px 14px 20px 14px",
              fontSize: Math.max(10, Math.min(13.5, w * 0.07)),
              lineHeight: 1.35,
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              fontWeight: 700,
            }}
          >
            {p.label || "Remember something"}
          </div>
        </div>
      );
    }

    case "callout": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h - 10} r={9} fill={PAPER} seed={seed} />
          <svg width={20} height={12} viewBox="0 0 20 12" style={{ position: "absolute", left: 22, bottom: 0 }}>
            <path d="M0 0 L20 0 L4 12 Z" fill={PAPER} stroke={INK} strokeWidth={1.1} />
            <path d="M0 0 L20 0" stroke={INK} strokeWidth={1.2} />
          </svg>
          <div style={{ position: "absolute", left: 12, right: 12, top: 0, height: h - 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <span className="wf-label" style={{ fontSize: Math.min(12.5, h * 0.17), lineHeight: 1.25 }}>{p.label || "Callout"}</span>
          </div>
        </div>
      );
    }

    case "number": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchCircle w={w} h={h} fill={INK} seed={seed} strokeWidth={1.2} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="wf-label" style={{ fontSize: Math.max(10, h * 0.42), color: "#fff", fontWeight: 700 }}>{p.label || "1"}</span>
          </div>
        </div>
      );
    }

    case "hotspot": {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={6} fill="rgba(74,110,224,.06)" stroke="#4A6EE0" dashed seed={seed} strokeWidth={1.3} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#4A6EE0" }}>
            <Glyph name={p.icon ?? "link"} size={Math.min(16, h * 0.36)} />
            <span className="wf-label" style={{ fontSize: Math.min(12, h * 0.28), fontWeight: 700 }}>{p.label || "Hotspot"}</span>
          </div>
        </div>
      );
    }

    case "stat": {
      const items = p.items?.length ? p.items : ["Metric", "12", "+2.4%"];
      const sparkW = Math.min(86, w * 0.3);
      const points: string[] = [];
      for (let i = 0; i < 6; i++) {
        const x = (sparkW / 5) * i;
        const y = 30 - rnd(seed, i) * 24;
        points.push(`${x},${y}`);
      }
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SketchRect w={w} h={h} r={12} fill={PAPER} seed={seed} />
          <span className="wf-label" style={{ position: "absolute", left: 16, top: 14, fontSize: 11.5, color: MUTED, fontWeight: 700 }}>{items[0]}</span>
          <span className="wf-label" style={{ position: "absolute", left: 16, top: 34, fontSize: Math.min(30, h * 0.25), fontWeight: 700, lineHeight: 1.1 }}>{items[1]}</span>
          <div style={{ position: "absolute", left: 16, bottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
            <Glyph name={p.icon ?? "trending_up"} size={14} />
            <span className="wf-label" style={{ fontSize: 10.5, color: MUTED }}>{items[2]}</span>
          </div>
          <svg width={sparkW} height={38} viewBox={`0 0 ${sparkW} 38`} style={{ position: "absolute", right: 14, top: h / 2 - 12 }}>
            <polyline points={points.join(" ")} fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          </svg>
        </div>
      );
    }

    default:
      return <SketchRect w={w} h={h} r={4} fill={PAPER} seed={seed} />;
  }
}
