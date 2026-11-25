import type { Frame, NapkinElement, Preset, Project } from "../types";
import { makeElement, uid } from "./components";

export const FRAME_PRESETS: Record<Exclude<Preset, "custom">, { w: number; h: number; label: string }> = {
  phone: { w: 390, h: 844, label: "Phone" },
  tablet: { w: 820, h: 1180, label: "Tablet" },
  desktop: { w: 1440, h: 900, label: "Desktop" },
  blank: { w: 1080, h: 720, label: "Blank" },
};

function at(
  type: NapkinElement["type"],
  x: number,
  y: number,
  w?: number,
  h?: number,
  props?: Partial<NapkinElement["props"]>,
): NapkinElement {
  return makeElement(type, x, y, w, h, props);
}

function frame(
  name: string,
  preset: Preset,
  x: number,
  y: number,
  w: number,
  h: number,
  elements: NapkinElement[],
  shell = true,
): Frame {
  return { id: uid("f"), name, preset, x, y, w, h, shell, elements };
}

export function createDemoProject(): Project {
  const home = frame("Home", "phone", 0, 0, 390, 844, [
    at("app-bar", 0, 36, 390, 60, {
      label: "Tidepool",
      icon: "menu",
      icon2: "search",
      icon3: "account_circle",
    }),
    at("text", 20, 116, 330, 32, { label: "Good morning, Akshay", variant: "h2" }),
    at("text", 20, 150, 320, 22, { label: "Here's what's brewing today.", variant: "muted" }),
    at("search-bar", 20, 186, 350, 52, { placeholder: "Search your library" }),
    at("chips", 20, 254, 330, 36, {
      items: ["All", "New", "Saved", "Filters"],
      selectedIndex: 0,
    }),
    at("card", 20, 306, 350, 168, {
      label: "Morning ritual kit",
      variant: "outlined",
      lines: 2,
    }),
    at("text", 20, 494, 200, 26, { label: "For you", variant: "h3" }),
    at("text", 300, 496, 70, 20, { label: "See all", variant: "link", align: "right", color: "#46716d" }),
    at("list", 20, 528, 350, 152, {
      items: ["Warm up with a pour-over", "The quiet hour", "Notes on slow mornings"],
    }),
    at("progress", 20, 692, 260, 8, { value: 68, color: "#46716d" }),
    at("fab", 312, 690, 56, 56, { icon: "add", color: "#46716d" }),
    at("nav-bar", 0, 764, 390, 80, {
      items: ["Home", "Explore", "Saved", "You"],
      icons: ["home", "explore", "bookmark", "person"],
      selectedIndex: 0,
    }),
  ]);

  const product = frame("Product", "phone", 470, 0, 390, 844, [
    at("app-bar", 0, 36, 390, 60, {
      label: "Product",
      icon: "arrow_back",
      icon2: "bookmark",
      icon3: "share",
    }),
    at("image", 20, 112, 350, 270),
    at("badge", 296, 124, 54, 24, { label: "NEW", variant: "count", color: "#9e5647" }),
    at("text", 20, 396, 310, 32, { label: "Hand-thrown mug", variant: "h2" }),
    at("rating", 20, 436, 150, 24, { label: "102", value: 5 }),
    at("text", 250, 430, 120, 32, { label: "€ 12,66", variant: "h3", align: "right" }),
    at("paragraph", 20, 474, 350, 44, { lines: 3 }),
    at("chips", 20, 532, 340, 36, {
      items: ["Speckled", "Glazed", "Stoneware"],
      selectedIndex: 0,
      color: "#8f6b2c",
    }),
    at("text", 20, 586, 320, 20, { label: "Colour — Oat", variant: "muted" }),
    at("segmented-button", 20, 614, 150, 44, { items: ["1", "2", "3"], selectedIndex: 1 }),
    at("button", 182, 614, 188, 44, {
      label: "Add to bag",
      icon: "shopping_bag",
      variant: "filled",
      color: "#46716d",
    }),
    at("text", 20, 670, 320, 20, { label: "Free delivery over €50", variant: "muted" }),
    at("divider", 20, 704, 350, 2),
    at("list-item", 20, 716, 350, 40, { label: "From the same studio" }),
    at("nav-bar", 0, 764, 390, 80, {
      items: ["Home", "Explore", "Saved", "You"],
      icons: ["home", "explore", "bookmark", "person"],
      selectedIndex: 1,
    }),
  ]);

  const dashboard = frame("Dashboard", "desktop", 940, 0, 1180, 820, [
    at("nav-rail", 0, 0, 88, 820, {
      items: ["Home", "Library", "Insights", "Settings"],
      icons: ["home", "folder", "insert_chart", "settings"],
      selectedIndex: 2,
    }),
    at("app-bar", 88, 0, 1092, 64, {
      label: "Overview",
      icon2: "search",
      icon3: "notifications",
      icon4: "account_circle",
    }),
    at("text", 128, 100, 600, 36, { label: "Good morning, Akshay", variant: "h1" }),
    at("text", 128, 142, 400, 20, { label: "Tuesday, 19 November", variant: "muted" }),
    at("segmented-button", 872, 112, 280, 40, {
      items: ["Week", "Month", "Year"],
      selectedIndex: 1,
      color: "#566a92",
    }),
    at("stat", 128, 188, 304, 130, {
      items: ["Active projects", "12", "+2 this week"],
      icon: "trending_up",
    }),
    at("stat", 452, 188, 304, 130, {
      items: ["Frames this week", "48", "+16%"],
      icon: "trending_up",
    }),
    at("stat", 776, 188, 304, 130, {
      items: ["Exports", "126", "+24%"],
      icon: "trending_up",
    }),
    at("chart", 128, 352, 640, 360, { label: "Frames created" }),
    at("table", 792, 352, 348, 360, { items: ["Project", "Frames", "Updated"] }),
    at("snackbar", 128, 736, 380, 52, {
      label: "Export finished · 3 PNGs",
      color: "#46716d",
    }),
    at("extended-fab", 920, 708, 170, 56, { label: "New frame", icon: "add", color: "#46716d" }),
  ]);

  return {
    version: 1,
    id: uid("p"),
    name: "Tidepool flow",
    frames: [home, product, dashboard],
    images: [],
    updatedAt: Date.now(),
  };
}

export function createEmptyProject(): Project {
  return {
    version: 1,
    id: uid("p"),
    name: "Untitled napkin",
    frames: [],
    images: [],
    updatedAt: Date.now(),
  };
}

export function defaultFrameName(frames: Frame[], preset: Preset): string {
  const label = preset === "phone" ? "Mobile" : preset === "desktop" ? "Desktop" : preset === "tablet" ? "Tablet" : "Frame";
  const n = frames.filter((f) => f.preset === preset).length + 1;
  return `${label} ${n}`;
}
