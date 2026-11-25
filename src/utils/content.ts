import type { ElementType, NapkinElement } from "../types";

/**
 * Only components whose label is actually painted on the wireframe should
 * expose a text field. Everything else used to show a "Label" input that had
 * no visible effect.
 */
const LABEL_TYPES = new Set<ElementType>([
  "button",
  "extended-fab",
  "split-button",
  "badge",
  "snackbar",
  "tooltip",
  "card",
  "list-item",
  "dialog",
  "bottom-sheet",
  "side-sheet",
  "app-bar",
  "nav-drawer",
  "checkbox",
  "radio",
  "switch",
  "slider",
  "text",
  "avatar",
  "video",
  "chart",
  "rating",
  "sticky",
  "callout",
  "number",
  "hotspot",
]);

const PLACEHOLDER_TYPES = new Set<ElementType>(["search-bar", "text-field", "text-area"]);

/** Components that actually render their `items` array. */
const ITEM_TYPES = new Set<ElementType>([
  "segmented-button",
  "button-group",
  "list",
  "nav-bar",
  "nav-rail",
  "tabs",
  "chips",
  "menu",
  "table",
  "stat",
  "dialog",
  "bottom-sheet",
  "side-sheet",
]);

/** Item-driven components where items, not a label, are the primary text. */
const EDIT_ITEMS_TYPES = new Set<ElementType>([
  "segmented-button",
  "button-group",
  "list",
  "nav-bar",
  "nav-rail",
  "tabs",
  "chips",
  "menu",
  "table",
  "stat",
]);

export type EditableField = "label" | "placeholder" | "items";

export interface EditableTarget {
  field: EditableField;
  title: string;
  value: string;
}

export function showsLabel(el: Pick<NapkinElement, "type" | "props" | "h">): boolean {
  if (el.type === "text-field" || el.type === "text-area") return el.props.showLabel === true;
  if (el.type === "slider") return el.h >= 34;
  return LABEL_TYPES.has(el.type);
}

export function showsPlaceholder(type: ElementType): boolean {
  return PLACEHOLDER_TYPES.has(type);
}

export function showsItems(type: ElementType): boolean {
  return ITEM_TYPES.has(type);
}

export function labelHeading(type: ElementType): string {
  switch (type) {
    case "text":
    case "paragraph":
      return "Text";
    case "sticky":
    case "callout":
      return "Note";
    case "app-bar":
    case "nav-drawer":
    case "chart":
      return "Title";
    case "avatar":
      return "Initials";
    case "video":
      return "Duration";
    case "rating":
      return "Count";
    case "number":
      return "Number";
    case "hotspot":
      return "Text";
    default:
      return "Label";
  }
}

/**
 * What a double-click (or the pencil in the selection toolbar) should edit.
 * Search bars and inputs target the placeholder, item-driven components target
 * the items, and only visibly-labelled parts expose their label.
 */
export function editTarget(el: NapkinElement): EditableTarget | null {
  if (EDIT_ITEMS_TYPES.has(el.type)) {
    return { field: "items", title: "Edit items", value: (el.props.items ?? []).join(", ") };
  }
  if (PLACEHOLDER_TYPES.has(el.type)) {
    return { field: "placeholder", title: "Edit placeholder", value: el.props.placeholder ?? "" };
  }
  if (showsLabel(el)) {
    return { field: "label", title: "Edit text", value: el.props.label ?? "" };
  }
  return null;
}

export function parseItems(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
