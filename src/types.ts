export type Preset = "phone" | "tablet" | "desktop" | "blank" | "custom";

export type ElementType =
  | "button"
  | "icon-button"
  | "fab"
  | "extended-fab"
  | "split-button"
  | "segmented-button"
  | "button-group"
  | "badge"
  | "progress"
  | "snackbar"
  | "tooltip"
  | "card"
  | "carousel"
  | "list"
  | "list-item"
  | "divider"
  | "dialog"
  | "bottom-sheet"
  | "side-sheet"
  | "scroll-view"
  | "app-bar"
  | "bottom-app-bar"
  | "search-bar"
  | "nav-bar"
  | "nav-rail"
  | "nav-drawer"
  | "tabs"
  | "toolbar"
  | "checkbox"
  | "radio"
  | "switch"
  | "chips"
  | "menu"
  | "slider"
  | "text-field"
  | "text-area"
  | "text"
  | "paragraph"
  | "image"
  | "avatar"
  | "video"
  | "map"
  | "chart"
  | "table"
  | "rectangle"
  | "rounded-rect"
  | "circle"
  | "line"
  | "arrow"
  | "rating"
  | "icon"
  | "sticky"
  | "callout"
  | "number"
  | "hotspot"
  | "stat";

export interface ElementProps {
  label?: string;
  variant?: string;
  state?: "default" | "hover" | "focused" | "pressed" | "disabled";
  icon?: string;
  icon2?: string;
  icon3?: string;
  icon4?: string;
  items?: string[];
  icons?: string[];
  checked?: boolean;
  selectedIndex?: number;
  value?: number;
  size?: string;
  widthMode?: "hug" | "fill";
  iconStyle?: "rounded" | "outlined" | "sharp";
  iconFill?: boolean;
  iconWeight?: number;
  align?: "left" | "center" | "right";
  lines?: number;
  placeholder?: string;
}

export interface NapkinElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
  locked?: boolean;
  hidden?: boolean;
  props: ElementProps;
}

export interface Frame {
  id: string;
  name: string;
  preset: Preset;
  x: number;
  y: number;
  w: number;
  h: number;
  shell: boolean;
  elements: NapkinElement[];
}

export interface Project {
  version: 1;
  id: string;
  name: string;
  frames: Frame[];
  updatedAt: number;
}

export interface ComponentSpec {
  type: ElementType;
  name: string;
  group: ComponentGroup;
  aliases: string[];
  icon: string;
  platforms: ("mobile" | "desktop" | "both")[];
  defaultW: number;
  defaultH: number;
  defaults: ElementProps;
}

export type ComponentGroup =
  | "Actions"
  | "Navigation"
  | "Containment"
  | "Communication"
  | "Selection"
  | "Text inputs"
  | "Primitives";

export interface ViewState {
  zoom: number;
  tx: number;
  ty: number;
}

export interface Point {
  x: number;
  y: number;
}

export type Tool = "select" | "hand" | "frames" | "markup";

export type Flyout = "components" | "icons" | "images" | "markup" | "frames" | null;
