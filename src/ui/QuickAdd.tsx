import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CornerDownLeft, Search, Sparkles } from "lucide-react";
import { COMPONENTS, SPECS } from "../data/components";
import { ICONS, POPULAR_ICONS } from "../data/iconData";
import { useStore } from "../store";
import type { ElementProps, ElementType } from "../types";
import { insertComponent } from "../utils/placement";
import { searchComponents, searchIcons } from "../utils/fuzzy";
import { Glyph, SketchProvider } from "../components/Sketch";
import { Wireframe } from "../components/Wireframe";

interface QuickItem {
  key: string;
  kind: "component" | "icon";
  name: string;
  hint: string;
  type?: ElementType;
  props?: Partial<ElementProps>;
  iconName?: string;
  shortcut?: boolean;
  variant?: string;
}

const EMPTY_SUGGESTIONS: ElementType[] = [
  "button",
  "app-bar",
  "search-bar",
  "card",
  "text",
  "nav-bar",
  "image",
  "fab",
];

const CHEATS: { value: string; label: string }[] = [
  { value: "[ Button ]", label: "[ Label ] button" },
  { value: "[x]", label: "[x] checkbox" },
  { value: "(o)", label: "(o) radio" },
  { value: "___", label: "___ text field" },
  { value: "---", label: "--- divider" },
  { value: "@home", label: "@home icon" },
];

function parseTextFirst(raw: string): QuickItem | null {
  const q = raw.trim();
  if (!q) return null;

  const bracket = q.match(/^\[([^\]]*)\]$/);
  if (bracket) {
    const inner = bracket[1];
    const isCheckbox = inner.toLowerCase() === "x" || inner === "" || inner.toLowerCase() === "checkbox";
    if (isCheckbox) {
      return {
        key: "shortcut-checkbox",
        kind: "component",
        type: "checkbox",
        name: inner.toLowerCase() === "x" ? "Checked checkbox" : "Checkbox",
        hint: "Text shortcut",
        shortcut: true,
        props: { label: "Checkbox", checked: inner.toLowerCase() === "x" },
      };
    }
    return {
      key: "shortcut-button",
      kind: "component",
      type: "button",
      name: inner || "Button",
      hint: "Text shortcut",
      shortcut: true,
      props: { label: inner || "Button", variant: "filled" },
    };
  }

  if (/^\([oO ]\)$/.test(q)) {
    return {
      key: "shortcut-radio",
      kind: "component",
      type: "radio",
      name: "Radio button",
      hint: "Text shortcut",
      shortcut: true,
      props: { label: "Option", checked: /[oO]/.test(q) },
    };
  }

  if (/^_{3,}$/.test(q)) {
    return {
      key: "shortcut-field",
      kind: "component",
      type: "text-field",
      name: "Text field",
      hint: "Text shortcut",
      shortcut: true,
      props: { label: "Label", placeholder: "Input text" },
    };
  }

  if (/^-{3,}$/.test(q)) {
    return {
      key: "shortcut-divider",
      kind: "component",
      type: "divider",
      name: "Divider",
      hint: "Text shortcut",
      shortcut: true,
    };
  }

  const at = q.match(/^@([a-z0-9_]+)$/i) ?? q.match(/^:([a-z0-9_]+):$/i);
  if (at) {
    return {
      key: `shortcut-icon-${at[1]}`,
      kind: "icon",
      name: at[1].replace(/_/g, " "),
      hint: "Text shortcut",
      shortcut: true,
      iconName: at[1],
    };
  }

  return null;
}

function ComponentThumb({ type, props }: { type: ElementType; props?: Partial<ElementProps> }) {
  const spec = SPECS[type];
  const scale = Math.min(37 / spec.defaultW, 27 / spec.defaultH, 1);
  return (
    <span className="quick-thumb">
      <span
        style={{
          width: spec.defaultW,
          height: spec.defaultH,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          position: "absolute",
          left: "50%",
          top: "50%",
          display: "block",
        }}
      >
        <SketchProvider roughness={0} clean>
          <span style={{ position: "absolute", inset: 0, display: "block", fontFamily: "var(--font-hand)" }}>
            <Wireframe type={type} w={spec.defaultW} h={spec.defaultH} p={{ ...spec.defaults, ...props }} seed={7} />
          </span>
        </SketchProvider>
      </span>
    </span>
  );
}

export function QuickAdd() {
  const seed = useStore((s) => s.quickAddSeed);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const [query, setQuery] = useState(seed);
  const [index, setIndex] = useState(0);
  const [pointer, setPointer] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(seed);
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [seed]);

  useEffect(() => {
    const move = (e: PointerEvent) => setPointer({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const items = useMemo<QuickItem[]>(() => {
    const q = query.trim();
    if (!q) {
      const components = EMPTY_SUGGESTIONS.map((type) => SPECS[type])
        .filter(Boolean)
        .map((spec) => ({
          key: `c-${spec.type}`,
          kind: "component" as const,
          type: spec.type,
          name: spec.name,
          hint: spec.group,
        }));
      const icons = POPULAR_ICONS.slice(0, 8).map((n) => ({
        key: `i-${n}`,
        kind: "icon" as const,
        name: n.replace(/_/g, " "),
        hint: "Material Symbols",
        iconName: n,
      }));
      return [...components, ...icons];
    }

    const out: QuickItem[] = [];
    const shortcut = parseTextFirst(q);
    if (shortcut) out.push(shortcut);

    const iconOnly = q.startsWith("@") || q.startsWith(":");
    if (!iconOnly) {
      const matches = searchComponents(COMPONENTS, q.replace(/^\/+/, "")).slice(0, shortcut ? 6 : 9);
      matches.forEach((spec) => {
        out.push({
          key: `c-${spec.type}`,
          kind: "component",
          type: spec.type,
          name: spec.name,
          hint: spec.group,
        });
      });
    }

    const iconQuery = q.replace(/^[@:]/, "").replace(/:$/, "");
    if (iconQuery) {
      const icons = searchIcons(ICONS, iconQuery).slice(0, iconOnly ? 14 : 6);
      icons.forEach((icon) => {
        out.push({
          key: `i-${icon.n}`,
          kind: "icon",
          name: icon.n.replace(/_/g, " "),
          hint: icon.cat,
          iconName: icon.n,
        });
      });
    }

    if (!out.length && !iconOnly) {
      // A forgiving fallback: treat the typed text as a button label.
      if (q.length <= 34) {
        out.push({
          key: "fallback-button",
          kind: "component",
          type: "button",
          name: `Button “${q}”`,
          hint: "Insert as a button label",
          shortcut: true,
          props: { label: q, variant: "filled" },
        });
      }
    }
    return out.slice(0, 18);
  }, [query]);

  useEffect(() => setIndex(0), [query]);
  const selectedIndex = Math.min(index, Math.max(0, items.length - 1));
  const current = items[selectedIndex];

  const insert = (item: QuickItem, keepOpen: boolean) => {
    if (item.kind === "icon" && item.iconName) {
      insertComponent(
        "icon",
        { icon: item.iconName, iconStyle: "rounded", iconFill: false, iconWeight: 400 },
        { w: 32, h: 32 },
      );
    } else if (item.type) {
      insertComponent(item.type, item.props);
    }
    if (keepOpen) {
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setPaletteOpen(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (current) insert(current, e.shiftKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setPaletteOpen(false);
    }
  };

  let lastKind: string | null = null;
  const ghostSpec = current?.kind === "component" && current.type ? SPECS[current.type] : null;
  const ghostW = ghostSpec ? Math.min(210, Math.max(72, ghostSpec.defaultW)) : 0;
  const ghostH = ghostSpec ? Math.min(92, Math.max(28, ghostSpec.defaultH)) : 0;

  return (
    <div
      className="quickadd-overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setPaletteOpen(false);
      }}
    >
      {ghostSpec && (
        <div
          className="quick-ghost"
          style={{ left: pointer.x + 18, top: pointer.y + 18, width: ghostW, height: ghostH }}
        >
          <span className="quick-ghost-label">
            {current?.kind === "component" ? current.name : "Icon"}
          </span>
        </div>
      )}

      <div className="quickadd" role="dialog" aria-label="Quick add" onPointerDown={(e) => e.stopPropagation()}>
        <div className="quickadd-input-row">
          <Search size={18} className="quickadd-search-icon" />
          <span className="quickadd-slash">/</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Add anything: button, fab, search, :home:"
            aria-label="Search components and icons"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="quickadd-esc">esc</kbd>
        </div>

        <div className="quickadd-results" role="listbox" aria-activedescendant={current ? `quick-${current.key}` : undefined}>
          {items.length === 0 && (
            <div className="quickadd-empty">
              <div className="empty-face">:(</div>
              <p>Nothing called “{query}” yet.</p>
              <span>Try “button”, “chart”, or “:favorite:”.</span>
            </div>
          )}

          {items.map((item, i) => {
            const showHeader = item.kind !== lastKind;
            lastKind = item.kind;
            return (
              <div key={item.key}>
                {showHeader && (
                  <div className="quickadd-section">
                    <span>{item.kind === "component" ? "Components" : "Material Symbols"}</span>
                    <span>{item.shortcut ? "text shortcut" : "fuzzy match"}</span>
                  </div>
                )}
                <button
                  id={`quick-${item.key}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  className={`quickadd-item ${i === selectedIndex ? "selected" : ""}`}
                  onMouseEnter={() => setIndex(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => insert(item, false)}
                >
                  {item.kind === "component" && item.type ? (
                    <ComponentThumb type={item.type} props={item.props} />
                  ) : (
                    <span className="quick-thumb quick-icon-thumb">
                      <Glyph name={item.iconName} size={24} />
                    </span>
                  )}
                  <span className="quick-item-text">
                    <span className="quick-item-name">
                      {item.name}
                      {item.shortcut && <span className="quick-shortcut-badge">shortcut</span>}
                    </span>
                    <span className="quick-item-hint">{item.hint}</span>
                  </span>
                  <span className="quick-item-enter">{i === selectedIndex ? <CornerDownLeft size={14} /> : <ArrowRight size={13} />}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="quickadd-cheats">
          <span className="quickadd-cheats-label"><Sparkles size={12} /> type it</span>
          {CHEATS.map((cheat) => (
            <button
              key={cheat.value}
              className="cheat-chip"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery(cheat.value);
                inputRef.current?.focus();
              }}
              title={cheat.label}
            >
              {cheat.value}
            </button>
          ))}
        </div>

        <div className="quickadd-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> browse</span>
          <span><kbd>↵</kbd> insert at cursor</span>
          <span><kbd>⇧↵</kbd> add another</span>
          <span className="quickadd-foot-right"><Glyph name="bolt" size={12} /> quick-add</span>
        </div>
      </div>
    </div>
  );
}
