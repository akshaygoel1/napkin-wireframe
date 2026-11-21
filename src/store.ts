import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  ElementProps,
  ElementType,
  Flyout,
  Frame,
  NapkinElement,
  Preset,
  Project,
  ViewState,
} from "./types";
import { makeElement, randomSeed, SPECS, uid } from "./data/components";
import { createDemoProject, createEmptyProject, FRAME_PRESETS } from "./data/starter";

const HISTORY_LIMIT = 80;

type IconSlot = "icon" | "icon2" | "icon3" | "icon4";

interface StoreState {
  project: Project;
  past: Project[];
  future: Project[];
  selection: string[];
  selectedFrameId: string | null;
  view: ViewState;
  tool: "select" | "hand";
  armed: { type: ElementType; variant?: string; props?: Partial<ElementProps>; w?: number; h?: number } | null;
  paletteOpen: boolean;
  flyout: Flyout;
  contextMenu: { x: number; y: number } | null;
  exportOpen: boolean;
  shortcutsOpen: boolean;
  newFrameOpen: boolean;
  aboutOpen: boolean;
  iconSlot: IconSlot | null;
  quickAddSeed: string;
  grid: boolean;
  sketchiness: number;
  cleanExport: boolean;
  inspectorOpen: boolean;
  toast: { id: number; text: string; action?: string; onAction?: () => void } | null;
  recents: string[];
  favorites: string[];
  exportFrameFilter: string[] | null;

  // history
  snapshot: (snapshot?: Project) => void;
  undo: () => void;
  redo: () => void;

  // project
  setProject: (p: Project, resetView?: boolean) => void;
  newProject: (kind: "blank" | "demo") => void;
  renameProject: (name: string) => void;
  downloadProject: () => void;
  importProject: (p: Project) => void;

  // frames
  addFrame: (preset: Preset, name?: string, w?: number, h?: number) => Frame;
  updateFrame: (id: string, patch: Partial<Frame>, record?: boolean) => void;
  deleteFrame: (id: string) => void;
  duplicateFrame: (id: string) => void;
  selectFrame: (id: string | null) => void;

  // elements
  insertElement: (
    frameId: string,
    type: ElementType,
    x: number,
    y: number,
    w?: number,
    h?: number,
    props?: Partial<ElementProps>,
    select?: boolean,
  ) => NapkinElement | null;
  updateElement: (id: string, patch: Partial<NapkinElement>, record?: boolean) => void;
  updateProps: (id: string, props: Partial<ElementProps>, record?: boolean) => void;
  removeElements: (ids: string[]) => void;
  duplicateSelection: () => void;
  pasteElements: () => void;
  copySelection: () => void;
  selectElements: (ids: string[], frameId?: string | null) => void;
  toggleSelection: (id: string, frameId: string) => void;
  selectAllInFrame: () => void;
  nudgeSelection: (dx: number, dy: number) => void;
  bringToFront: () => void;
  sendToBack: () => void;
  reorder: (direction: "front" | "back" | "up" | "down") => void;
  alignSelection: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  reSeedSelection: () => void;

  // view + ui
  setView: (view: Partial<ViewState>) => void;
  setTool: (tool: "select" | "hand") => void;
  setArmed: (armed: { type: ElementType; variant?: string; props?: Partial<ElementProps>; w?: number; h?: number } | null) => void;
  setContextMenu: (menu: { x: number; y: number } | null) => void;
  setPaletteOpen: (open: boolean, seed?: string) => void;
  setFlyout: (flyout: Flyout) => void;
  setExportOpen: (open: boolean, frameFilter?: string[] | null) => void;
  setShortcutsOpen: (open: boolean) => void;
  setNewFrameOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  openIconPicker: (slot?: IconSlot | null) => void;
  applyIcon: (name: string, patch?: Partial<ElementProps>) => void;
  swapElement: (id: string, type: ElementType) => void;
  setGrid: (on: boolean) => void;
  setSketchiness: (n: number) => void;
  setCleanExport: (on: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  showToast: (text: string, action?: string, onAction?: () => void) => void;
  clearToast: () => void;
  addRecentIcon: (name: string) => void;
  toggleFavoriteIcon: (name: string) => void;
}

let pasteBuffer: { frameId: string; elements: NapkinElement[] } | null = null;

// JSON cloning works on both plain state and Immer drafts (structuredClone
// throws on proxies), and project data is always JSON-safe.
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function pushPast(state: StoreState, snapshot?: Project) {
  state.past.push(snapshot ? clone(snapshot) : clone(state.project));
  if (state.past.length > HISTORY_LIMIT) state.past.shift();
  state.future = [];
}

function findElement(project: Project, id: string) {
  for (const frame of project.frames) {
    const el = frame.elements.find((e) => e.id === id);
    if (el) return { frame, el };
  }
  return null;
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem("napkin.prefs.v1");
    if (!raw) return { grid: true, sketchiness: 1.2, recents: [] as string[], favorites: [] as string[] };
    const p = JSON.parse(raw);
    return {
      grid: p.grid !== false,
      sketchiness: typeof p.sketchiness === "number" ? p.sketchiness : 1.2,
      recents: Array.isArray(p.recents) ? p.recents.slice(0, 20) : [],
      favorites: Array.isArray(p.favorites) ? p.favorites.slice(0, 60) : [],
    };
  } catch {
    return { grid: true, sketchiness: 1.2, recents: [] as string[], favorites: [] as string[] };
  }
}

const prefs = loadPrefs();

const PROJECT_KEY = "napkin.project.v1";

function isValidProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Project>;
  return p.version === 1 && typeof p.name === "string" && Array.isArray(p.frames);
}

function loadProject(): Project | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidProject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistProject(project: Project) {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  } catch {
    /* the board still works, it just will not survive a refresh */
  }
}

function savePrefs(state: StoreState) {
  try {
    localStorage.setItem(
      "napkin.prefs.v1",
      JSON.stringify({
        grid: state.grid,
        sketchiness: state.sketchiness,
        recents: state.recents,
        favorites: state.favorites,
      }),
    );
  } catch {
    /* ignore */
  }
}

const initialProject = loadProject() ?? createDemoProject();

export const useStore = create<StoreState>()(
  immer((set, get) => ({
    project: initialProject,
    past: [],
    future: [],
    selection: [],
    selectedFrameId: null,
    view: { zoom: 0.6, tx: 80, ty: 120 },
    tool: "select",
    armed: null,
    paletteOpen: false,
    flyout: null,
    contextMenu: null,
    exportOpen: false,
    shortcutsOpen: false,
    newFrameOpen: false,
    aboutOpen: false,
    iconSlot: null,
    quickAddSeed: "",
    grid: prefs.grid,
    sketchiness: prefs.sketchiness,
    cleanExport: false,
    inspectorOpen: true,
    toast: null,
    recents: prefs.recents,
    favorites: prefs.favorites,
    exportFrameFilter: null,

    snapshot: (snapshot) =>
      set((s) => {
        pushPast(s, snapshot);
        s.project.updatedAt = Date.now();
      }),

    undo: () =>
      set((s) => {
        const prev = s.past.pop();
        if (!prev) return;
        s.future.push(clone(s.project));
        s.project = prev;
        const valid = new Set(s.project.frames.flatMap((f) => f.elements.map((e) => e.id)));
        s.selection = s.selection.filter((id) => valid.has(id));
        if (s.selectedFrameId && !s.project.frames.some((f) => f.id === s.selectedFrameId)) {
          s.selectedFrameId = null;
        }
        s.armed = null;
      }),

    redo: () =>
      set((s) => {
        const next = s.future.pop();
        if (!next) return;
        s.past.push(clone(s.project));
        s.project = next;
        const valid = new Set(s.project.frames.flatMap((f) => f.elements.map((e) => e.id)));
        s.selection = s.selection.filter((id) => valid.has(id));
      }),

    setProject: (p, resetView) =>
      set((s) => {
        s.project = p;
        s.past = [];
        s.future = [];
        s.selection = [];
        s.selectedFrameId = p.frames[0]?.id ?? null;
        s.armed = null;
        s.paletteOpen = false;
        if (resetView) s.view = { zoom: 0.6, tx: 80, ty: 120 };
      }),

    newProject: (kind) =>
      set((s) => {
        pushPast(s);
        s.project = kind === "demo" ? createDemoProject() : createEmptyProject();
        s.selection = [];
        s.selectedFrameId = s.project.frames[0]?.id ?? null;
        s.paletteOpen = false;
        s.flyout = null;
        s.armed = null;
        s.project.updatedAt = Date.now();
      }),

    renameProject: (name) =>
      set((s) => {
        if (!name.trim()) return;
        pushPast(s);
        s.project.name = name.trim();
        s.project.updatedAt = Date.now();
      }),

    downloadProject: () => {
      const p = get().project;
      const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${p.name.replace(/[^\w\- ]+/g, "").trim() || "napkin"}.napkin`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      get().showToast("Project downloaded as a .napkin file");
    },

    importProject: (p) =>
      set((s) => {
        pushPast(s);
        s.project = p;
        s.selection = [];
        s.selectedFrameId = p.frames[0]?.id ?? null;
        s.project.updatedAt = Date.now();
      }),

    addFrame: (preset, name, w, h) => {
      const state = get();
      const presetSize =
        preset === "custom"
          ? { w: w ?? 390, h: h ?? 844 }
          : FRAME_PRESETS[preset as keyof typeof FRAME_PRESETS] ?? FRAME_PRESETS.blank;
      const width = w ?? presetSize.w;
      const height = h ?? presetSize.h;
      const rightMost = state.project.frames.reduce((m, f) => Math.max(m, f.x + f.w), -Infinity);
      const x = state.project.frames.length ? rightMost + 120 : 0;
      const y = 0;
      const count = state.project.frames.filter((f) => f.preset === preset).length + 1;
      const names: Record<string, string> = {
        phone: "Mobile screen",
        tablet: "Tablet",
        desktop: "Desktop",
        blank: "Frame",
        custom: "Frame",
      };
      const frame: Frame = {
        id: uid("f"),
        name: name || `${names[preset] ?? "Frame"} ${count}`,
        preset,
        x,
        y,
        w: width,
        h: height,
        shell: preset !== "blank",
        elements: [],
      };
      set((s) => {
        pushPast(s);
        s.project.frames.push(frame);
        s.project.updatedAt = Date.now();
        s.selection = [];
        s.selectedFrameId = frame.id;
        s.newFrameOpen = false;
      });
      return frame;
    },

    updateFrame: (id, patch, record = true) =>
      set((s) => {
        const frame = s.project.frames.find((f) => f.id === id);
        if (!frame) return;
        if (record) pushPast(s);
        Object.assign(frame, patch);
        s.project.updatedAt = Date.now();
      }),

    deleteFrame: (id) =>
      set((s) => {
        const idx = s.project.frames.findIndex((f) => f.id === id);
        if (idx < 0) return;
        pushPast(s);
        const removed = s.project.frames.splice(idx, 1)[0];
        s.selection = s.selection.filter((eid) => !removed.elements.some((e) => e.id === eid));
        if (s.selectedFrameId === id) s.selectedFrameId = s.project.frames[0]?.id ?? null;
        s.project.updatedAt = Date.now();
      }),

    duplicateFrame: (id) =>
      set((s) => {
        const f = s.project.frames.find((x) => x.id === id);
        if (!f) return;
        pushPast(s);
        const copy: Frame = clone(f);
        copy.id = uid("f");
        copy.name = `${f.name} copy`;
        copy.x = f.x + f.w + 120;
        copy.elements = f.elements.map((e) => ({ ...e, id: uid() }));
        s.project.frames.push(copy);
        s.project.updatedAt = Date.now();
        s.selectedFrameId = copy.id;
        s.selection = [];
      }),

    selectFrame: (id) =>
      set((s) => {
        s.selectedFrameId = id;
        s.selection = [];
      }),

    insertElement: (frameId, type, x, y, w, h, props, select = true) => {
      const spec = SPECS[type];
      if (!spec) return null;
      const el = makeElement(type, x, y, w, h, props);
      set((s) => {
        const frame = s.project.frames.find((f) => f.id === frameId);
        if (!frame) return;
        pushPast(s);
        frame.elements.push(el);
        if (select) {
          s.selection = [el.id];
          s.selectedFrameId = frameId;
        }
        s.project.updatedAt = Date.now();
      });
      return el;
    },

    updateElement: (id, patch, record = true) =>
      set((s) => {
        const found = findElement(s.project, id);
        if (!found) return;
        if (record) pushPast(s);
        Object.assign(found.el, patch);
        s.project.updatedAt = Date.now();
      }),

    updateProps: (id, props, record = true) =>
      set((s) => {
        const found = findElement(s.project, id);
        if (!found) return;
        if (record) pushPast(s);
        Object.assign(found.el.props, props);
        s.project.updatedAt = Date.now();
      }),

    removeElements: (ids) =>
      set((s) => {
        if (!ids.length) return;
        pushPast(s);
        const del = new Set(ids);
        s.project.frames.forEach((f) => {
          f.elements = f.elements.filter((e) => !del.has(e.id));
        });
        s.selection = s.selection.filter((id) => !del.has(id));
        s.project.updatedAt = Date.now();
      }),

    duplicateSelection: () =>
      set((s) => {
        if (!s.selection.length) return;
        pushPast(s);
        const newIds: string[] = [];
        s.selection.forEach((id) => {
          const found = findElement(s.project, id);
          if (!found) return;
          const copy = clone(found.el);
          copy.id = uid();
          copy.seed = randomSeed();
          copy.x += 24;
          copy.y += 24;
          found.frame.elements.push(copy);
          newIds.push(copy.id);
        });
        s.selection = newIds;
        s.project.updatedAt = Date.now();
      }),

    copySelection: () => {
      const s = get();
      if (!s.selection.length) return;
      const first = findElement(s.project, s.selection[0]);
      if (!first) return;
      const elements = s.selection
        .map((id) => findElement(s.project, id)?.el)
        .filter(Boolean) as NapkinElement[];
      pasteBuffer = { frameId: first.frame.id, elements: clone(elements) };
      s.showToast(`${elements.length} ${elements.length === 1 ? "element" : "elements"} copied`);
    },

    pasteElements: () =>
      set((s) => {
        if (!pasteBuffer) return;
        const frame = s.project.frames.find((f) => f.id === pasteBuffer!.frameId) ?? s.project.frames[0];
        if (!frame) return;
        pushPast(s);
        const ids: string[] = [];
        pasteBuffer.elements.forEach((el) => {
          const copy = clone(el);
          copy.id = uid();
          copy.seed = randomSeed();
          copy.x += 24;
          copy.y += 24;
          frame.elements.push(copy);
          ids.push(copy.id);
        });
        s.selection = ids;
        s.selectedFrameId = frame.id;
        s.project.updatedAt = Date.now();
      }),

    selectElements: (ids, frameId) =>
      set((s) => {
        s.selection = ids;
        if (frameId !== undefined) s.selectedFrameId = frameId;
      }),

    toggleSelection: (id, frameId) =>
      set((s) => {
        if (s.selection.includes(id)) s.selection = s.selection.filter((x) => x !== id);
        else s.selection.push(id);
        s.selectedFrameId = frameId;
      }),

    selectAllInFrame: () =>
      set((s) => {
        const frame = s.project.frames.find((f) => f.id === s.selectedFrameId) ?? s.project.frames[0];
        if (!frame) return;
        s.selection = frame.elements.map((e) => e.id);
        s.selectedFrameId = frame.id;
      }),

    nudgeSelection: (dx, dy) =>
      set((s) => {
        if (!s.selection.length) return;
        if (s.past.length === 0) pushPast(s);
        else {
          const last = s.past[s.past.length - 1];
          const currentKey = JSON.stringify(
            s.project.frames.flatMap((f) => f.elements.filter((e) => s.selection.includes(e.id)).map((e) => [e.id, e.x, e.y])),
          );
          const lastKey = JSON.stringify(
            last.frames.flatMap((f) => f.elements.filter((e) => s.selection.includes(e.id)).map((e) => [e.id, e.x, e.y])),
          );
          if (currentKey === lastKey) {
            // coalesce repeated nudges
          } else pushPast(s);
        }
        s.selection.forEach((id) => {
          const found = findElement(s.project, id);
          if (!found) return;
          found.el.x += dx;
          found.el.y += dy;
        });
        s.project.updatedAt = Date.now();
      }),

    bringToFront: () => get().reorder("front"),
    sendToBack: () => get().reorder("back"),

    reorder: (direction) =>
      set((s) => {
        if (!s.selection.length) return;
        pushPast(s);
        s.selection.forEach((id) => {
          const found = findElement(s.project, id);
          if (!found) return;
          const arr = found.frame.elements;
          const idx = arr.findIndex((e) => e.id === id);
          if (idx < 0) return;
          const [el] = arr.splice(idx, 1);
          if (direction === "front") arr.push(el);
          else if (direction === "back") arr.unshift(el);
          else if (direction === "up") arr.splice(Math.min(arr.length, idx + 1), 0, el);
          else arr.splice(Math.max(0, idx - 1), 0, el);
        });
        s.project.updatedAt = Date.now();
      }),

    alignSelection: (mode) =>
      set((s) => {
        if (s.selection.length < 2) return;
        const items = s.selection
          .map((id) => findElement(s.project, id))
          .filter(Boolean) as { frame: Frame; el: NapkinElement }[];
        if (!items.length) return;
        pushPast(s);
        const minX = Math.min(...items.map((i) => i.el.x));
        const maxX = Math.max(...items.map((i) => i.el.x + i.el.w));
        const minY = Math.min(...items.map((i) => i.el.y));
        const maxY = Math.max(...items.map((i) => i.el.y + i.el.h));
        items.forEach(({ el }) => {
          if (mode === "left") el.x = minX;
          if (mode === "right") el.x = maxX - el.w;
          if (mode === "center") el.x = Math.round((minX + maxX) / 2 - el.w / 2);
          if (mode === "top") el.y = minY;
          if (mode === "bottom") el.y = maxY - el.h;
          if (mode === "middle") el.y = Math.round((minY + maxY) / 2 - el.h / 2);
        });
        s.project.updatedAt = Date.now();
      }),

    reSeedSelection: () =>
      set((s) => {
        if (!s.selection.length) return;
        pushPast(s);
        s.selection.forEach((id) => {
          const found = findElement(s.project, id);
          if (found) found.el.seed = randomSeed();
        });
        s.project.updatedAt = Date.now();
      }),

    setView: (view) =>
      set((s) => {
        Object.assign(s.view, view);
      }),
    setTool: (tool) => set((s) => { s.tool = tool; }),
    setArmed: (armed) =>
      set((s) => {
        s.armed = armed;
        s.contextMenu = null;
        if (armed) {
          s.paletteOpen = false;
          s.tool = "select";
        }
      }),
    setContextMenu: (menu) => set((s) => { s.contextMenu = menu; }),
    setPaletteOpen: (open, seed = "") =>
      set((s) => {
        s.paletteOpen = open;
        s.quickAddSeed = open ? seed : "";
        s.contextMenu = null;
        if (open) {
          s.flyout = null;
          s.armed = null;
        }
      }),
    setFlyout: (flyout) =>
      set((s) => {
        s.flyout = s.flyout === flyout ? null : flyout;
        if (s.flyout) {
          s.paletteOpen = false;
          s.armed = null;
          s.iconSlot = null;
        }
      }),
    setExportOpen: (open, frameFilter) =>
      set((s) => {
        s.exportOpen = open;
        s.exportFrameFilter = open ? frameFilter ?? null : null;
        if (open) s.paletteOpen = false;
      }),
    setShortcutsOpen: (open) => set((s) => { s.shortcutsOpen = open; }),
    setNewFrameOpen: (open) => set((s) => { s.newFrameOpen = open; }),
    setAboutOpen: (open) => set((s) => { s.aboutOpen = open; }),
    openIconPicker: (slot) =>
      set((s) => {
        s.flyout = "icons";
        s.iconSlot = slot ?? null;
        s.paletteOpen = false;
      }),
    applyIcon: (name, patch) =>
      set((s) => {
        const slot = s.iconSlot;
        if (slot && s.selection.length) {
          const found = findElement(s.project, s.selection[0]);
          if (found) {
            pushPast(s);
            found.el.props[slot] = name;
            if (patch) Object.assign(found.el.props, patch);
            s.project.updatedAt = Date.now();
          }
        }
        s.recents = [name, ...s.recents.filter((n) => n !== name)].slice(0, 20);
        savePrefs(s as StoreState);
        s.flyout = null;
        s.iconSlot = null;
      }),

    swapElement: (id, type) =>
      set((s) => {
        const found = findElement(s.project, id);
        const spec = SPECS[type];
        if (!found || !spec) return;
        pushPast(s);
        const old = found.el;
        found.el.type = type;
        found.el.props = {
          ...spec.defaults,
          ...old.props,
          label: old.props.label ?? spec.defaults.label,
          icon: old.props.icon ?? spec.defaults.icon,
          variant: spec.defaults.variant,
        };
        found.el.seed = randomSeed();
        s.project.updatedAt = Date.now();
      }),
    setGrid: (on) =>
      set((s) => {
        s.grid = on;
        savePrefs(s as StoreState);
      }),
    setSketchiness: (n) =>
      set((s) => {
        s.sketchiness = n;
        savePrefs(s as StoreState);
      }),
    setCleanExport: (on) => set((s) => { s.cleanExport = on; }),
    setInspectorOpen: (open) => set((s) => { s.inspectorOpen = open; }),
    showToast: (text, action, onAction) =>
      set((s) => {
        s.toast = { id: Date.now(), text, action, onAction };
      }),
    clearToast: () => set((s) => { s.toast = null; }),
    addRecentIcon: (name) =>
      set((s) => {
        s.recents = [name, ...s.recents.filter((n) => n !== name)].slice(0, 20);
        savePrefs(s as StoreState);
      }),
    toggleFavoriteIcon: (name) =>
      set((s) => {
        s.favorites = s.favorites.includes(name)
          ? s.favorites.filter((n) => n !== name)
          : [name, ...s.favorites].slice(0, 60);
        savePrefs(s as StoreState);
      }),
  })),
);

// Dev-only handle for e2e checks and debugging in the browser console.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __napkinStore?: typeof useStore }).__napkinStore = useStore;
}

// Local-first autosave. Every project change is flushed shortly after the user stops.
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe((state, prev) => {
  if (state.project === prev.project) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    persistProject(state.project);
    autosaveTimer = null;
  }, 350);
});

if (typeof window !== "undefined") {
  persistProject(initialProject);
  window.addEventListener("beforeunload", () => {
    persistProject(useStore.getState().project);
  });
}

export function useSelectedElement(): NapkinElement | null {
  const id = useStore((s) => s.selection[0]);
  const project = useStore((s) => s.project);
  if (!id) return null;
  for (const f of project.frames) {
    const el = f.elements.find((e) => e.id === id);
    if (el) return el;
  }
  return null;
}

export function useSelectedFrame(): Frame | null {
  const id = useStore((s) => s.selectedFrameId);
  return useStore((s) => s.project.frames.find((f) => f.id === id) ?? null);
}
