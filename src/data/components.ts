import type { ComponentGroup, ComponentSpec, ElementType, NapkinElement } from "../types";

export const GROUP_ORDER: ComponentGroup[] = [
  "Actions",
  "Navigation",
  "Containment",
  "Communication",
  "Selection",
  "Text inputs",
  "Primitives",
];

export const COMPONENTS: ComponentSpec[] = [
  // ---------------------------------------------------------------- Actions
  {
    type: "button", name: "Button", group: "Actions", icon: "smart_button",
    aliases: ["btn", "cta", "primary", "action", "filled", "button"],
    platforms: ["both"], defaultW: 150, defaultH: 44,
    defaults: { label: "Button", variant: "filled", state: "default", size: "m" },
  },
  {
    type: "icon-button", name: "Icon button", group: "Actions", icon: "ads_click",
    aliases: ["iconbtn", "icon", "action", "circle"],
    platforms: ["both"], defaultW: 44, defaultH: 44,
    defaults: { icon: "favorite", variant: "standard", state: "default", label: "" },
  },
  {
    type: "fab", name: "FAB", group: "Actions", icon: "add_circle",
    aliases: ["floating", "action", "plus", "button"],
    platforms: ["mobile", "both"], defaultW: 56, defaultH: 56,
    defaults: { icon: "add", variant: "medium", label: "" },
  },
  {
    type: "extended-fab", name: "Extended FAB", group: "Actions", icon: "add",
    aliases: ["fab extended", "floating", "new", "create"],
    platforms: ["both"], defaultW: 158, defaultH: 56,
    defaults: { icon: "add", label: "New" },
  },
  {
    type: "split-button", name: "Split button", group: "Actions", icon: "arrow_drop_down_circle",
    aliases: ["split", "dropdown", "menu button"],
    platforms: ["both"], defaultW: 172, defaultH: 44,
    defaults: { label: "Split button", icon: "arrow_drop_down" },
  },
  {
    type: "segmented-button", name: "Segmented button", group: "Actions", icon: "view_week",
    aliases: ["seg", "segmented", "toggle group", "tabs"],
    platforms: ["both"], defaultW: 246, defaultH: 40,
    defaults: { items: ["Day", "Week", "Month"], selectedIndex: 0 },
  },
  {
    type: "button-group", name: "Button group", group: "Actions", icon: "view_module",
    aliases: ["group", "connected", "buttons", "seg"],
    platforms: ["both"], defaultW: 240, defaultH: 40,
    defaults: { items: ["Cut", "Copy", "Paste"] },
  },

  // ------------------------------------------------------------- Navigation
  {
    type: "app-bar", name: "Top app bar", group: "Navigation", icon: "web_asset",
    aliases: ["appbar", "header", "top bar", "navbar"],
    platforms: ["both"], defaultW: 390, defaultH: 64,
    defaults: { label: "App title", icon: "menu", icon2: "search", icon3: "more_vert", variant: "small" },
  },
  {
    type: "bottom-app-bar", name: "Bottom app bar", group: "Navigation", icon: "border_bottom",
    aliases: ["bottom bar", "appbar", "footer"],
    platforms: ["mobile"], defaultW: 390, defaultH: 64,
    defaults: { icon: "menu", icon2: "search", icon3: "notifications" },
  },
  {
    type: "search-bar", name: "Search bar", group: "Navigation", icon: "search",
    aliases: ["search", "searchbox", "find", "input"],
    platforms: ["both"], defaultW: 350, defaultH: 52,
    defaults: { label: "Search", icon: "search", variant: "pill", placeholder: "Search" },
  },
  {
    type: "nav-bar", name: "Navigation bar", group: "Navigation", icon: "bottom_navigation",
    aliases: ["nav", "navbar", "bottom nav", "tabs", "destinations"],
    platforms: ["mobile"], defaultW: 390, defaultH: 80,
    defaults: { items: ["Home", "Explore", "Saved", "You"], icons: ["home", "explore", "bookmark", "person"], selectedIndex: 0 },
  },
  {
    type: "nav-rail", name: "Navigation rail", group: "Navigation", icon: "view_sidebar",
    aliases: ["nav", "rail", "sidebar", "side nav"],
    platforms: ["desktop"], defaultW: 88, defaultH: 360,
    defaults: { items: ["Home", "Library", "Insights", "Settings"], icons: ["home", "folder", "insert_chart", "settings"], selectedIndex: 0 },
  },
  {
    type: "nav-drawer", name: "Navigation drawer", group: "Navigation", icon: "menu_open",
    aliases: ["nav", "drawer", "sidebar", "menu"],
    platforms: ["both"], defaultW: 300, defaultH: 340,
    defaults: { label: "Napkin", items: ["Home", "Projects", "Shared", "Archive"], icons: ["home", "folder", "group", "archive"], selectedIndex: 0 },
  },
  {
    type: "tabs", name: "Tabs", group: "Navigation", icon: "tab",
    aliases: ["tab", "tabbar", "switcher"],
    platforms: ["both"], defaultW: 360, defaultH: 48,
    defaults: { items: ["Overview", "Activity", "Settings"], selectedIndex: 0 },
  },
  {
    type: "toolbar", name: "Toolbar", group: "Navigation", icon: "build",
    aliases: ["tool", "actions", "bar"],
    platforms: ["both"], defaultW: 300, defaultH: 48,
    defaults: { icons: ["format_bold", "format_italic", "format_underlined", "link"] },
  },

  // ------------------------------------------------------------ Containment
  {
    type: "card", name: "Card", group: "Containment", icon: "web_asset",
    aliases: ["container", "tile", "panel", "surface"],
    platforms: ["both"], defaultW: 320, defaultH: 200,
    defaults: { label: "Card title", variant: "outlined", lines: 2 },
  },
  {
    type: "carousel", name: "Carousel", group: "Containment", icon: "view_carousel",
    aliases: ["slider", "gallery", "cards", "images"],
    platforms: ["both"], defaultW: 340, defaultH: 160,
    defaults: { items: ["Morning ritual", "Slow living"] },
  },
  {
    type: "list", name: "List", group: "Containment", icon: "view_list",
    aliases: ["rows", "items", "listview"],
    platforms: ["both"], defaultW: 350, defaultH: 168,
    defaults: { items: ["Warm up with a pour-over", "The quiet hour", "Notes on slow mornings"] },
  },
  {
    type: "list-item", name: "List item", group: "Containment", icon: "reorder",
    aliases: ["row", "item", "list"],
    platforms: ["both"], defaultW: 350, defaultH: 64,
    defaults: { label: "List item", variant: "1-line" },
  },
  {
    type: "divider", name: "Divider", group: "Containment", icon: "horizontal_rule",
    aliases: ["hr", "line", "separator", "rule"],
    platforms: ["both"], defaultW: 300, defaultH: 2,
    defaults: {},
  },
  {
    type: "dialog", name: "Dialog", group: "Containment", icon: "chat_bubble",
    aliases: ["modal", "popup", "alert", "confirm"],
    platforms: ["both"], defaultW: 340, defaultH: 220,
    defaults: { label: "Save changes?", items: ["Cancel", "Save"] },
  },
  {
    type: "bottom-sheet", name: "Bottom sheet", group: "Containment", icon: "vertical_align_top",
    aliases: ["sheet", "drawer", "modal", "panel"],
    platforms: ["mobile"], defaultW: 360, defaultH: 220,
    defaults: { label: "Filters", items: ["Category", "Price", "Rating"] },
  },
  {
    type: "side-sheet", name: "Side sheet", group: "Containment", icon: "view_sidebar",
    aliases: ["sheet", "drawer", "panel", "sidebar"],
    platforms: ["desktop"], defaultW: 300, defaultH: 380,
    defaults: { label: "Settings", items: ["Profile", "Notifications", "Billing", "Team"] },
  },
  {
    type: "scroll-view", name: "Scroll view", group: "Containment", icon: "swap_vert",
    aliases: ["scroll", "container", "overflow", "list"],
    platforms: ["both"], defaultW: 320, defaultH: 320,
    defaults: { label: "Scroll view" },
  },

  // ---------------------------------------------------------- Communication
  {
    type: "badge", name: "Badge", group: "Communication", icon: "notifications",
    aliases: ["count", "dot", "notification", "pill"],
    platforms: ["both"], defaultW: 26, defaultH: 26,
    defaults: { label: "12", variant: "count" },
  },
  {
    type: "progress", name: "Progress", group: "Communication", icon: "hourglass_empty",
    aliases: ["loading", "spinner", "bar", "indicator"],
    platforms: ["both"], defaultW: 240, defaultH: 10,
    defaults: { variant: "linear", value: 60 },
  },
  {
    type: "snackbar", name: "Snackbar", group: "Communication", icon: "chat_bubble",
    aliases: ["toast", "notification", "message", "alert"],
    platforms: ["both"], defaultW: 320, defaultH: 56,
    defaults: { label: "Draft saved", icon: "check_circle", icon2: "Undo" },
  },
  {
    type: "tooltip", name: "Tooltip", group: "Communication", icon: "info",
    aliases: ["hint", "help", "popover"],
    platforms: ["both"], defaultW: 140, defaultH: 40,
    defaults: { label: "Tooltip" },
  },

  // -------------------------------------------------------------- Selection
  {
    type: "checkbox", name: "Checkbox", group: "Selection", icon: "check_box",
    aliases: ["check", "tick", "control"],
    platforms: ["both"], defaultW: 180, defaultH: 26,
    defaults: { label: "Checkbox", checked: true },
  },
  {
    type: "radio", name: "Radio button", group: "Selection", icon: "radio_button_checked",
    aliases: ["radio", "option", "choice"],
    platforms: ["both"], defaultW: 180, defaultH: 26,
    defaults: { label: "Option", checked: true },
  },
  {
    type: "switch", name: "Switch", group: "Selection", icon: "toggle_on",
    aliases: ["toggle", "on off", "control"],
    platforms: ["both"], defaultW: 180, defaultH: 30,
    defaults: { label: "Switch", checked: true },
  },
  {
    type: "chips", name: "Chips", group: "Selection", icon: "sell",
    aliases: ["chip", "filter", "tags", "pills"],
    platforms: ["both"], defaultW: 330, defaultH: 36,
    defaults: { items: ["Filter", "Popular", "Nearby"], selectedIndex: 0 },
  },
  {
    type: "menu", name: "Menu", group: "Selection", icon: "list",
    aliases: ["dropdown", "popover", "options", "select"],
    platforms: ["both"], defaultW: 220, defaultH: 180,
    defaults: { items: ["Profile", "Settings", "Help", "Sign out"] },
  },
  {
    type: "slider", name: "Slider", group: "Selection", icon: "linear_scale",
    aliases: ["range", "track", "volume", "value"],
    platforms: ["both"], defaultW: 240, defaultH: 32,
    defaults: { value: 60, label: "Volume" },
  },

  // ------------------------------------------------------------ Text inputs
  {
    type: "text-field", name: "Text field", group: "Text inputs", icon: "text_fields",
    aliases: ["input", "field", "form", "textbox"],
    platforms: ["both"], defaultW: 320, defaultH: 56,
    defaults: { label: "Label", showLabel: false, placeholder: "Input text", variant: "outlined", icon: "" },
  },
  {
    type: "text-area", name: "Text area", group: "Text inputs", icon: "notes",
    aliases: ["textarea", "input", "message", "form"],
    platforms: ["both"], defaultW: 320, defaultH: 104,
    defaults: { label: "Message", showLabel: false, placeholder: "Write something…" },
  },

  // -------------------------------------------------------------- Primitives
  {
    type: "text", name: "Text", group: "Primitives", icon: "title",
    aliases: ["heading", "title", "copy", "label", "type"],
    platforms: ["both"], defaultW: 260, defaultH: 30,
    defaults: { label: "Text", variant: "body", align: "left" },
  },
  {
    type: "paragraph", name: "Paragraph", group: "Primitives", icon: "notes",
    aliases: ["text", "squiggle", "copy", "block"],
    platforms: ["both"], defaultW: 300, defaultH: 56,
    defaults: { lines: 4 },
  },
  {
    type: "image", name: "Image", group: "Primitives", icon: "image",
    aliases: ["picture", "photo", "placeholder", "media"],
    platforms: ["both"], defaultW: 280, defaultH: 180,
    defaults: {},
  },
  {
    type: "avatar", name: "Avatar", group: "Primitives", icon: "account_circle",
    aliases: ["user", "profile", "photo", "person"],
    platforms: ["both"], defaultW: 56, defaultH: 56,
    defaults: { label: "" },
  },
  {
    type: "video", name: "Video player", group: "Primitives", icon: "play_circle",
    aliases: ["video", "media", "player", "movie"],
    platforms: ["both"], defaultW: 300, defaultH: 170,
    defaults: { label: "0:24" },
  },
  {
    type: "map", name: "Map", group: "Primitives", icon: "map",
    aliases: ["location", "places", "geo"],
    platforms: ["both"], defaultW: 300, defaultH: 180,
    defaults: {},
  },
  {
    type: "chart", name: "Chart", group: "Primitives", icon: "insert_chart",
    aliases: ["graph", "bars", "data", "analytics"],
    platforms: ["both"], defaultW: 300, defaultH: 200,
    defaults: { label: "Weekly activity" },
  },
  {
    type: "table", name: "Table", group: "Primitives", icon: "table_chart",
    aliases: ["grid", "data", "rows", "columns"],
    platforms: ["both"], defaultW: 320, defaultH: 180,
    defaults: { items: ["Name", "Status", "Date"] },
  },
  {
    type: "rectangle", name: "Rectangle", group: "Primitives", icon: "crop_square",
    aliases: ["box", "square", "shape", "frame"],
    platforms: ["both"], defaultW: 200, defaultH: 120,
    defaults: {},
  },
  {
    type: "rounded-rect", name: "Rounded rectangle", group: "Primitives", icon: "rounded_corner",
    aliases: ["box", "card", "rounded", "shape"],
    platforms: ["both"], defaultW: 200, defaultH: 120,
    defaults: {},
  },
  {
    type: "circle", name: "Circle", group: "Primitives", icon: "circle",
    aliases: ["ellipse", "oval", "shape", "round"],
    platforms: ["both"], defaultW: 120, defaultH: 120,
    defaults: {},
  },
  {
    type: "line", name: "Line", group: "Primitives", icon: "horizontal_rule",
    aliases: ["rule", "divider", "stroke"],
    platforms: ["both"], defaultW: 200, defaultH: 2,
    defaults: {},
  },
  {
    type: "arrow", name: "Arrow", group: "Primitives", icon: "north_east",
    aliases: ["pointer", "connector", "markup", "direction"],
    platforms: ["both"], defaultW: 170, defaultH: 90,
    defaults: {},
  },
  {
    type: "rating", name: "Rating", group: "Primitives", icon: "star",
    aliases: ["stars", "review", "score", "feedback"],
    platforms: ["both"], defaultW: 170, defaultH: 24,
    defaults: { label: "102", value: 5 },
  },
  {
    type: "icon", name: "Icon", group: "Primitives", icon: "star",
    aliases: ["symbol", "glyph", "material"],
    platforms: ["both"], defaultW: 32, defaultH: 32,
    defaults: { icon: "star", iconStyle: "rounded", iconFill: false, iconWeight: 400 },
  },
  {
    type: "sticky", name: "Sticky note", group: "Primitives", icon: "sticky_note_2",
    aliases: ["note", "markup", "comment", "post-it"],
    platforms: ["both"], defaultW: 190, defaultH: 150,
    defaults: { label: "Remember: keep it rough" },
  },
  {
    type: "callout", name: "Callout", group: "Primitives", icon: "chat_bubble",
    aliases: ["markup", "annotation", "speech", "bubble"],
    platforms: ["both"], defaultW: 210, defaultH: 86,
    defaults: { label: "This is a callout" },
  },
  {
    type: "number", name: "Number marker", group: "Primitives", icon: "looks_one",
    aliases: ["marker", "step", "badge", "annotation"],
    platforms: ["both"], defaultW: 32, defaultH: 32,
    defaults: { label: "1" },
  },
  {
    type: "hotspot", name: "Hotspot", group: "Primitives", icon: "link",
    aliases: ["link", "click", "markup", "prototype"],
    platforms: ["both"], defaultW: 150, defaultH: 44,
    defaults: { label: "Hotspot", icon: "link" },
  },
  {
    type: "stat", name: "Stat card", group: "Primitives", icon: "analytics",
    aliases: ["metric", "kpi", "dashboard", "number"],
    platforms: ["desktop", "both"], defaultW: 300, defaultH: 130,
    defaults: { items: ["Active projects", "12", "+2.4%"], icon: "trending_up" },
  },
];

export const SPECS: Record<ElementType, ComponentSpec> = Object.fromEntries(
  COMPONENTS.map((c) => [c.type, c]),
) as Record<ElementType, ComponentSpec>;

let idCounter = 0;
export function uid(prefix = "e"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${idCounter}`;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 90000) + 1000;
}

export function makeElement(
  type: ElementType,
  x: number,
  y: number,
  w?: number,
  h?: number,
  props?: Partial<NapkinElement["props"]>,
): NapkinElement {
  const spec = SPECS[type];
  return {
    id: uid(),
    type,
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w ?? spec.defaultW),
    h: Math.round(h ?? spec.defaultH),
    seed: randomSeed(),
    props: { ...spec.defaults, ...props },
  };
}

export const COMPONENT_BY_ALIAS = (query: string): ComponentSpec[] => {
  const q = query.trim().toLowerCase();
  if (!q) return COMPONENTS;
  return COMPONENTS.filter((c) => {
    const hay = [c.name, c.type, c.group, ...c.aliases].join(" ").toLowerCase();
    return hay.includes(q);
  });
};
