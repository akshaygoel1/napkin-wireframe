import type { ElementType } from "../types";

/**
 * Eight deliberately desaturated presets. They are dark enough to carry white
 * text on filled surfaces and muted enough to stay wireframe-friendly.
 */
export const PRESET_COLORS = [
  { name: "Charcoal", value: "#47434f" },
  { name: "Brick", value: "#9e5647" },
  { name: "Amber", value: "#8f6b2c" },
  { name: "Olive", value: "#61703f" },
  { name: "Teal", value: "#46716d" },
  { name: "Slate", value: "#566a92" },
  { name: "Plum", value: "#74587a" },
  { name: "Rose", value: "#995663" },
];

/** Elements that understand the contextual colour control. */
export const COLOR_TYPES: ElementType[] = [
  "button",
  "icon-button",
  "fab",
  "extended-fab",
  "split-button",
  "segmented-button",
  "button-group",
  "badge",
  "progress",
  "snackbar",
  "tooltip",
  "checkbox",
  "radio",
  "switch",
  "chips",
  "text",
  "rectangle",
  "rounded-rect",
  "circle",
];

const COLOR_SET = new Set<string>(COLOR_TYPES);

export function supportsColor(type: ElementType) {
  return COLOR_SET.has(type);
}

export function isPresetColor(value?: string) {
  return !!value && PRESET_COLORS.some((c) => c.value.toLowerCase() === value.toLowerCase());
}

function parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return [38, 35, 43];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(r: number, g: number, b: number) {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mix(a: string, b: string, amount: number) {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const t = Math.max(0, Math.min(1, amount));
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Pull a strong colour toward white for soft tints. */
export function soften(hex: string, amount = 0.84) {
  return mix(hex, "#ffffff", amount);
}

/** Push a colour toward black so text stays readable on a soft tint. */
export function deepen(hex: string, amount = 0.22) {
  return mix(hex, "#000000", amount);
}

export function relativeLuminance(hex: string) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white ink for text sitting directly on the supplied colour. */
export function readableOn(hex: string) {
  return relativeLuminance(hex) > 0.46 ? "#26232b" : "#ffffff";
}
