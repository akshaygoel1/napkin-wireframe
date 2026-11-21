import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Heart, Search, Star, X } from "lucide-react";
import { ICON_CATEGORIES, ICONS, POPULAR_ICONS } from "../data/iconData";
import { useSelectedElement, useStore } from "../store";
import { searchIcons } from "../utils/fuzzy";
import { Glyph } from "../components/Sketch";

type IconStyle = "rounded" | "outlined" | "sharp";

export function IconPicker() {
  const setFlyout = useStore((s) => s.setFlyout);
  const setArmed = useStore((s) => s.setArmed);
  const iconSlot = useStore((s) => s.iconSlot);
  const applyIcon = useStore((s) => s.applyIcon);
  const recents = useStore((s) => s.recents);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavoriteIcon);
  const selectedEl = useSelectedElement();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [style, setStyle] = useState<IconStyle>("rounded");
  const [fill, setFill] = useState(false);
  const [weight, setWeight] = useState(400);
  const [size, setSize] = useState(24);
  const [selected, setSelected] = useState<string>("star");

  useEffect(() => {
    const fromSlot = iconSlot && selectedEl ? selectedEl.props[iconSlot] : undefined;
    const initial = fromSlot || selectedEl?.props.icon || recents[0] || "star";
    setSelected(initial);
    if (selectedEl?.props.iconStyle) setStyle(selectedEl.props.iconStyle);
    setFill(!!selectedEl?.props.iconFill);
    setWeight(selectedEl?.props.iconWeight ?? 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconSlot]);

  const pool = useMemo(() => {
    if (category === "All") return ICONS;
    if (category === "Popular") return ICONS.filter((i) => POPULAR_ICONS.includes(i.n));
    return ICONS.filter((i) => i.cat === category);
  }, [category]);

  const results = useMemo(() => searchIcons(pool, query), [pool, query]);
  const recentIcons = recents.map((n) => ICONS.find((i) => i.n === n)).filter(Boolean).slice(0, 8);
  const favoriteIcons = favorites.map((n) => ICONS.find((i) => i.n === n)).filter(Boolean).slice(0, 8);

  const isFavorite = favorites.includes(selected);
  const selectedEntry = ICONS.find((i) => i.n === selected);

  const commit = (name = selected) => {
    setSelected(name);
    if (iconSlot && selectedEl) {
      applyIcon(name, { iconStyle: style, iconFill: fill, iconWeight: weight });
      useStore.getState().showToast(`${name.replace(/_/g, " ")} applied`);
      return;
    }
    useStore.getState().addRecentIcon(name);
    setArmed({
      type: "icon",
      props: { icon: name, iconStyle: style, iconFill: fill, iconWeight: weight },
      w: size,
      h: size,
    });
  };

  return (
    <aside className="flyout icon-picker" aria-label="Icon picker">
      <div className="flyout-head">
        <div className="flyout-title">
          <span className="flyout-icon"><Glyph name="grid_view" size={17} /></span>
          <h2>{iconSlot ? "Replace icon" : "Icons"}</h2>
          <span className="flyout-count">{ICONS.length}</span>
        </div>
        <button className="icon-btn flyout-close" onClick={() => setFlyout(null)} aria-label="Close icon picker">
          <ChevronLeft size={17} />
        </button>
      </div>

      <div className="flyout-search">
        <Search size={15} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons — try trash, cart, sparkle…"
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && results.length) {
              e.preventDefault();
              commit(results[0].n);
            }
            if (e.key === "Escape") {
              const st = useStore.getState();
              if (st.armed) st.setArmed(null);
              else setFlyout(null);
            }
          }}
        />
        {query && (
          <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">
            <X size={13} />
          </button>
        )}
        <span className="icon-count">{results.length}</span>
      </div>

      <div className="icon-style-row">
        <div className="style-tabs" role="tablist" aria-label="Icon style">
          {(["outlined", "rounded", "sharp"] as const).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={style === s}
              className={style === s ? "active" : ""}
              onClick={() => setStyle(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          className={`fill-toggle ${fill ? "active" : ""}`}
          onClick={() => setFill((v) => !v)}
          title="Toggle filled icons"
          aria-pressed={fill}
        >
          <Glyph name="palette" size={15} fill={fill} glyphStyle={style} />
          Fill
        </button>
      </div>

      <div className="weight-row">
        <span>Weight</span>
        <input
          type="range"
          min={100}
          max={700}
          step={100}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          aria-label="Icon weight"
        />
        <span className="weight-value">{weight}</span>
      </div>

      <div className="category-chips" role="group" aria-label="Icon categories">
        {ICON_CATEGORIES.map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {!query && (recentIcons.length > 0 || favoriteIcons.length > 0) && (
        <div className="icon-strips">
          {recentIcons.length > 0 && (
            <div className="icon-strip">
              <span className="icon-strip-label">Recent</span>
              <div className="icon-strip-icons">
                {recentIcons.map((icon) => (
                  <button key={icon!.n} onClick={() => commit(icon!.n)} title={`Place ${icon!.n}`} className={selected === icon!.n ? "active" : ""}>
                    <Glyph name={icon!.n} size={20} glyphStyle={style} fill={fill} weight={weight} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {favoriteIcons.length > 0 && (
            <div className="icon-strip">
              <span className="icon-strip-label">Favorites</span>
              <div className="icon-strip-icons">
                {favoriteIcons.map((icon) => (
                  <button key={icon!.n} onClick={() => commit(icon!.n)} title={`Place ${icon!.n}`} className={selected === icon!.n ? "active" : ""}>
                    <Glyph name={icon!.n} size={20} glyphStyle={style} fill={fill} weight={weight} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flyout-scroll icon-scroll">
        {results.length === 0 ? (
          <div className="flyout-empty">
            <div className="empty-face">:(</div>
            <p>No icon named “{query}”.</p>
            <span>Try “trash”, “cart”, or “sparkle”.</span>
            <button className="link-btn" onClick={() => { setQuery(""); setCategory("All"); }}>Clear search</button>
          </div>
        ) : (
          <div className="icon-grid">
            {results.map((icon) => (
              <button
                key={icon.n}
                className={`icon-tile ${selected === icon.n ? "selected" : ""}`}
                onClick={() => commit(icon.n)}
                title={`Place ${icon.n}`}
              >
                <Glyph name={icon.n} size={25} glyphStyle={style} fill={fill} weight={weight} />
                <span>{icon.n.replace(/_/g, " ")}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="icon-preview-bar">
        <div className="icon-preview">
          <span className="icon-preview-glyph">
            <Glyph name={selected} size={34} glyphStyle={style} fill={fill} weight={weight} />
          </span>
          <span className="icon-preview-text">
            <b>{selectedEntry?.n ?? selected}</b>
            <small>{selectedEntry?.cat ?? "Material Symbols"} · {style}{fill ? " · filled" : ""}</small>
          </span>
        </div>
        <div className="icon-preview-actions">
          <button
            className={`icon-btn ${isFavorite ? "is-favorite" : ""}`}
            onClick={() => toggleFavorite(selected)}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
          >
            {isFavorite ? <Star size={16} fill="currentColor" /> : <Heart size={16} />}
          </button>
          <div className="icon-size-menu" role="group" aria-label="Icon size">
            {[16, 24, 32, 48].map((s) => (
              <button key={s} className={size === s ? "active" : ""} onClick={() => setSize(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flyout-foot icon-foot">
        {iconSlot
          ? "Click an icon to replace the current one"
          : <>Click an icon to place it on the canvas · <kbd>↵</kbd> places the first match</>}
      </div>
    </aside>
  );
}
