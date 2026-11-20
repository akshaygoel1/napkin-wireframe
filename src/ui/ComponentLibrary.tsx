import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { COMPONENTS, GROUP_ORDER, SPECS } from "../data/components";
import { useStore } from "../store";
import type { ComponentGroup, ComponentSpec } from "../types";
import { searchComponents } from "../utils/fuzzy";
import { SketchProvider, Glyph } from "../components/Sketch";
import { Wireframe } from "../components/Wireframe";

const VARIANTS: Partial<Record<ComponentSpec["type"], string[]>> = {
  button: ["filled", "tonal", "outlined", "text", "elevated"],
  "icon-button": ["standard", "filled", "tonal", "outlined"],
  card: ["outlined", "filled", "elevated"],
  progress: ["linear", "circular"],
  "search-bar": ["pill", "outlined"],
  "text-field": ["outlined", "filled"],
  text: ["h1", "h2", "h3", "body", "muted", "link"],
  badge: ["count", "dot"],
  "list-item": ["1-line", "2-line"],
  "app-bar": ["small", "center"],
};

function MiniPreview({ spec }: { spec: ComponentSpec }) {
  const [hover, setHover] = useState(false);
  const armed = useStore((s) => s.armed);
  const setArmed = useStore((s) => s.setArmed);
  const scale = useMemo(() => {
    const H = 62;
    const W = 126;
    return Math.min((W - 10) / spec.defaultW, H / spec.defaultH, 0.95);
  }, [spec]);
  const variants = VARIANTS[spec.type];

  return (
    <div
      className={`lib-tile ${armed?.type === spec.type ? "armed" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setArmed({ type: spec.type })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setArmed({ type: spec.type });
      }}
      title={`${spec.name} — click, then place on the canvas`}
    >
      <div className="lib-preview">
        <div
          style={{
            width: spec.defaultW,
            height: spec.defaultH,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            position: "absolute",
            left: "50%",
            top: "50%",
          }}
        >
          <SketchProvider roughness={1.1}>
            <div style={{ position: "absolute", inset: 0, fontFamily: "var(--font-hand)" }}>
              <Wireframe type={spec.type} w={spec.defaultW} h={spec.defaultH} p={spec.defaults} seed={42} />
            </div>
          </SketchProvider>
        </div>
        {hover && variants && (
          <div className="tile-variants" onClick={(e) => e.stopPropagation()}>
            {variants.map((v) => (
              <button
                key={v}
                onClick={() => setArmed({ type: spec.type, variant: v })}
                title={`Place a ${v} ${spec.name.toLowerCase()}`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="lib-tile-name">{spec.name}</span>
      {variants && <span className="lib-tile-chevron">⌄</span>}
    </div>
  );
}

export function ComponentLibrary() {
  const setFlyout = useStore((s) => s.setFlyout);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<"all" | "mobile" | "desktop">("all");
  const [collapsed, setCollapsed] = useState<Set<ComponentGroup>>(new Set(["Communication", "Selection", "Text inputs", "Primitives"]));

  const filtered = useMemo(() => {
    let list = COMPONENTS;
    if (platform !== "all") {
      list = list.filter((c) => c.platforms.includes("both") || c.platforms.includes(platform));
    }
    return searchComponents(list, query);
  }, [platform, query]);

  const grouped = useMemo(() => {
    const map = new Map<ComponentGroup, ComponentSpec[]>();
    GROUP_ORDER.forEach((g) => map.set(g, []));
    filtered.forEach((c) => map.get(c.group)?.push(c));
    return map;
  }, [filtered]);

  const searching = query.trim().length > 0;

  const toggleGroup = (g: ComponentGroup) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  return (
    <aside className="flyout component-library" aria-label="Component library">
      <div className="flyout-head">
        <div className="flyout-title">
          <span className="flyout-icon"><Glyph name="widgets" size={17} /></span>
          <h2>Components</h2>
          <span className="flyout-count">{COMPONENTS.length}</span>
        </div>
        <button className="icon-btn flyout-close" onClick={() => setFlyout(null)} aria-label="Close components">
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="flyout-search">
        <Search size={15} />
        <input
          autoFocus
          placeholder="Search components"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") setFlyout(null);
          }}
        />
        {query && (
          <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">
            <X size={13} />
          </button>
        )}
      </div>

      <div className="platform-filter" role="group" aria-label="Platform filter">
        {(["all", "mobile", "desktop"] as const).map((p) => (
          <button key={p} className={platform === p ? "active" : ""} onClick={() => setPlatform(p)}>
            {p === "all" ? "All" : p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="flyout-scroll">
        {filtered.length === 0 && (
          <div className="flyout-empty">
            <div className="empty-face">:(</div>
            <p>No components match “{query}”.</p>
            <button className="link-btn" onClick={() => { setQuery(""); setPlatform("all"); }}>
              Clear search and filters
            </button>
          </div>
        )}

        {GROUP_ORDER.map((group) => {
          const items = grouped.get(group) ?? [];
          if (!items.length) return null;
          const isCollapsed = !searching && collapsed.has(group);
          return (
            <section className="lib-group" key={group}>
              <button className="lib-group-head" onClick={() => toggleGroup(group)} disabled={searching}>
                {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                <span>{group}</span>
                <span className="lib-group-count">{items.length}</span>
              </button>
              {!isCollapsed && (
                <div className="lib-grid">
                  {items.map((spec) => (
                    <MiniPreview key={spec.type} spec={spec} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="flyout-foot">
        Click a tile, then click or drag on the canvas — or press <kbd>/</kbd> to type
      </div>
    </aside>
  );
}
