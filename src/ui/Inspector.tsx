import { useEffect, useMemo, useState } from "react";
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Frame as FrameIcon,
  Grid3X3,
  Layers,
  Maximize,
  MousePointer2,
  Palette,
  PencilLine,
  Plus,
  RefreshCw,
  Scan,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { COMPONENTS, SPECS } from "../data/components";
import { useSelectedElement, useSelectedFrame, useStore } from "../store";
import type { ElementProps, ElementType, NapkinElement } from "../types";
import { canvasApi } from "../utils/canvasApi";
import { clamp } from "../utils/geometry";
import { Glyph } from "../components/Sketch";

const VARIANT_OPTIONS: Partial<Record<ElementType, string[]>> = {
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
  snackbar: ["default"],
  tooltip: ["default"],
};

type IconSlot = "icon" | "icon2" | "icon3" | "icon4";

const ICON_SLOTS: Partial<Record<ElementType, IconSlot[]>> = {
  button: ["icon"],
  "icon-button": ["icon"],
  fab: ["icon"],
  "extended-fab": ["icon"],
  "split-button": ["icon"],
  "search-bar": ["icon", "icon2"],
  "app-bar": ["icon", "icon2", "icon3", "icon4"],
  "bottom-app-bar": ["icon", "icon2", "icon3"],
  snackbar: ["icon"],
  "text-field": ["icon"],
  stat: ["icon"],
  hotspot: ["icon"],
  icon: ["icon"],
};

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="insp-section">
      <div className="insp-section-head">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function NumField({
  value,
  onCommit,
  label,
  min,
  max,
}: {
  value: number;
  onCommit: (n: number) => void;
  label: string;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  useEffect(() => setDraft(String(Math.round(value))), [value]);
  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(Math.round(value)));
      return;
    }
    onCommit(min !== undefined || max !== undefined ? clamp(parsed, min ?? -99999, max ?? 99999) : parsed);
  };
  return (
    <label className="num-field">
      <span>{label}</span>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setDraft(String(Math.round(value)));
            e.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function TextField({
  value,
  onCommit,
  label,
  placeholder,
  multiline,
}: {
  value: string;
  onCommit: (v: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  const common = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" && !multiline) (e.currentTarget as HTMLElement).blur();
      if (e.key === "Escape") {
        setDraft(value);
        (e.currentTarget as HTMLElement).blur();
      }
    },
  };
  return (
    <label className="insp-field">
      <span>{label}</span>
      {multiline ? <textarea rows={3} {...common} /> : <input {...common} />}
    </label>
  );
}

function ItemsField({ el }: { el: NapkinElement }) {
  const updateProps = useStore((s) => s.updateProps);
  const value = (el.props.items ?? []).join(", ");
  return (
    <TextField
      label="Items"
      value={value}
      placeholder="One, two, three"
      onCommit={(v) => {
        const items = v
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        updateProps(el.id, { items });
      }}
    />
  );
}

function ValueSlider({ el, prop, label }: { el: NapkinElement; prop: "value"; label: string }) {
  const updateProps = useStore((s) => s.updateProps);
  const snapshot = useStore((s) => s.snapshot);
  return (
    <div className="insp-value">
      <div className="insp-value-head">
        <span>{label}</span>
        <b>{Math.round(el.props[prop] ?? 0)}%</b>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={el.props[prop] ?? 0}
        onPointerDown={() => snapshot()}
        onChange={(e) => updateProps(el.id, { [prop]: Number(e.target.value) }, false)}
      />
    </div>
  );
}

function IconSlotButton({ el, slot }: { el: NapkinElement; slot: IconSlot }) {
  const openIconPicker = useStore((s) => s.openIconPicker);
  const updateProps = useStore((s) => s.updateProps);
  const label =
    slot === "icon" ? "Leading icon" : slot === "icon2" ? "Second icon" : slot === "icon3" ? "Third icon" : "Fourth icon";
  const value = el.props[slot];
  return (
    <div className="icon-slot-row">
      <span className="insp-mini-label">{label}</span>
      <div className="icon-slot-control">
        <button className="icon-slot" onClick={() => openIconPicker(slot)} title={`Pick ${label.toLowerCase()}`}>
          {value ? <Glyph name={value} size={18} /> : <Plus size={15} />}
          <span>{value ? value.replace(/_/g, " ") : "Pick icon"}</span>
        </button>
        {value && (
          <button
            className="icon-btn icon-slot-clear"
            title="Remove icon"
            onClick={() => updateProps(el.id, { [slot]: "" })}
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function ElementInspector({ el }: { el: NapkinElement }) {
  const spec = SPECS[el.type];
  const frame = useSelectedFrame();
  const updateElement = useStore((s) => s.updateElement);
  const updateProps = useStore((s) => s.updateProps);
  const removeElements = useStore((s) => s.removeElements);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const reorder = useStore((s) => s.reorder);
  const reSeedSelection = useStore((s) => s.reSeedSelection);
  const swapElement = useStore((s) => s.swapElement);
  const variants = VARIANT_OPTIONS[el.type];
  const iconSlots = ICON_SLOTS[el.type] ?? [];
  const hasItems = Array.isArray(el.props.items);
  const hasLabel = el.props.label !== undefined || spec.defaults.label !== undefined || ["text", "paragraph", "sticky", "callout"].includes(el.type);
  const siblings = COMPONENTS.filter((c) => c.group === spec.group && c.type !== el.type);
  const labelFor = useMemo(() => {
    if (el.type === "text" || el.type === "paragraph") return "Text";
    if (el.type === "sticky" || el.type === "callout") return "Note";
    return "Label";
  }, [el.type]);

  return (
    <>
      <div className="insp-identity">
        <span className="insp-type-glyph"><Glyph name={spec.icon} size={18} /></span>
        <div>
          <h2>{spec.name}</h2>
          <p>{spec.group} · {el.type}</p>
        </div>
        <button className="icon-btn" onClick={() => removeElements([el.id])} title="Delete element">
          <Trash2 size={15} />
        </button>
      </div>

      <Section title="Position & size">
        <div className="num-grid">
          <NumField label="X" value={el.x} onCommit={(x) => updateElement(el.id, { x })} />
          <NumField label="Y" value={el.y} onCommit={(y) => updateElement(el.id, { y })} />
          <NumField label="W" value={el.w} min={8} onCommit={(w) => updateElement(el.id, { w })} />
          <NumField label="H" value={el.h} min={8} onCommit={(h) => updateElement(el.id, { h })} />
        </div>
        {frame && (
          <div className="width-mode">
            <span className="insp-mini-label">Width</span>
            <div className="seg-small">
              <button
                className={(el.props.widthMode ?? "hug") === "hug" ? "active" : ""}
                onClick={() => updateProps(el.id, { widthMode: "hug" })}
              >
                Hug
              </button>
              <button
                className={el.props.widthMode === "fill" ? "active" : ""}
                onClick={() => {
                  updateProps(el.id, { widthMode: "fill" });
                  updateElement(el.id, { x: 16, w: Math.max(24, frame.w - 32) });
                }}
              >
                Fill
              </button>
            </div>
          </div>
        )}
      </Section>

      {hasLabel && (
        <Section title="Content">
          <TextField
            label={labelFor}
            value={el.props.label ?? ""}
            placeholder={spec.defaults.label ?? "Type something"}
            onCommit={(label) => updateProps(el.id, { label })}
          />
          {(el.type === "text-field" || el.type === "text-area" || el.type === "search-bar") && (
            <TextField
              label="Placeholder"
              value={el.props.placeholder ?? ""}
              onCommit={(placeholder) => updateProps(el.id, { placeholder })}
            />
          )}
          {el.type === "paragraph" && (
            <NumField
              label="Lines"
              value={el.props.lines ?? 4}
              min={1}
              max={20}
              onCommit={(lines) => updateProps(el.id, { lines })}
            />
          )}
          {el.type === "card" && (
            <NumField
              label="Body lines"
              value={el.props.lines ?? 2}
              min={0}
              max={8}
              onCommit={(lines) => updateProps(el.id, { lines })}
            />
          )}
        </Section>
      )}

      {hasItems && (
        <Section title="Items">
          <ItemsField el={el} />
          <div className="insp-hint">Separate with commas. Selected index is set by the first highlighted item.</div>
          {(el.props.selectedIndex !== undefined || ["chips", "tabs", "nav-bar", "nav-rail", "segmented-button"].includes(el.type)) && (
            <NumField
              label="Selected"
              value={el.props.selectedIndex ?? 0}
              min={0}
              max={Math.max(0, (el.props.items?.length ?? 1) - 1)}
              onCommit={(selectedIndex) => updateProps(el.id, { selectedIndex })}
            />
          )}
        </Section>
      )}

      {variants && (
        <Section title="Variant">
          <div className="variant-chips">
            {variants.map((v) => (
              <button
                key={v}
                className={(el.props.variant ?? variants[0]) === v ? "active" : ""}
                onClick={() => updateProps(el.id, { variant: v })}
              >
                {v}
              </button>
            ))}
          </div>
        </Section>
      )}

      {el.type === "checkbox" || el.type === "radio" || el.type === "switch" ? (
        <Section title="State">
          <label className="toggle-row">
            <span>Checked</span>
            <input
              type="checkbox"
              checked={!!el.props.checked}
              onChange={(e) => updateProps(el.id, { checked: e.target.checked })}
            />
          </label>
        </Section>
      ) : null}

      {["button", "icon-button", "fab", "extended-fab", "split-button"].includes(el.type) && (
        <Section title="Interaction state">
          <div className="state-chips">
            {(["default", "hover", "focused", "pressed", "disabled"] as const).map((state) => (
              <button
                key={state}
                className={(el.props.state ?? "default") === state ? "active" : ""}
                onClick={() => updateProps(el.id, { state })}
              >
                {state}
              </button>
            ))}
          </div>
        </Section>
      )}

      {el.type === "text" && (
        <Section title="Alignment">
          <div className="seg-icons">
            <button className={(el.props.align ?? "left") === "left" ? "active" : ""} onClick={() => updateProps(el.id, { align: "left" })} title="Left">
              <AlignHorizontalJustifyStart size={16} />
            </button>
            <button className={el.props.align === "center" ? "active" : ""} onClick={() => updateProps(el.id, { align: "center" })} title="Center">
              <AlignHorizontalJustifyCenter size={16} />
            </button>
            <button className={el.props.align === "right" ? "active" : ""} onClick={() => updateProps(el.id, { align: "right" })} title="Right">
              <AlignHorizontalJustifyEnd size={16} />
            </button>
          </div>
        </Section>
      )}

      {el.type === "progress" || el.type === "slider" ? (
        <Section title="Value">
          <ValueSlider el={el} prop="value" label={el.type === "progress" ? "Progress" : "Value"} />
        </Section>
      ) : null}

      {iconSlots.length > 0 && (
        <Section title="Icons">
          {iconSlots.map((slot) => (
            <IconSlotButton key={slot} el={el} slot={slot} />
          ))}
          {el.type === "icon" && (
            <div className="icon-style-control">
              <div className="seg-small">
                {(["outlined", "rounded", "sharp"] as const).map((s) => (
                  <button
                    key={s}
                    className={(el.props.iconStyle ?? "rounded") === s ? "active" : ""}
                    onClick={() => updateProps(el.id, { iconStyle: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <label className="toggle-row compact">
                <span>Filled</span>
                <input
                  type="checkbox"
                  checked={!!el.props.iconFill}
                  onChange={(e) => updateProps(el.id, { iconFill: e.target.checked })}
                />
              </label>
            </div>
          )}
        </Section>
      )}

      <Section title="Component">
        <label className="insp-field">
          <span>Swap with</span>
          <select value={el.type} onChange={(e) => swapElement(el.id, e.target.value as ElementType)}>
            {siblings.map((c) => (
              <option key={c.type} value={c.type}>{c.name}</option>
            ))}
            <option value={el.type}>{spec.name} (current)</option>
          </select>
        </label>
        <div className="insp-hint">Same group, keeps your content and size where it can.</div>
      </Section>

      <Section title="Layer">
        <div className="layer-actions">
          <button onClick={() => reorder("front")} title="Bring to front"><ArrowUpToLine size={15} /><span>Front</span></button>
          <button onClick={() => reorder("up")} title="Bring forward"><Layers size={15} /><span>Forward</span></button>
          <button onClick={() => reorder("down")} title="Send backward"><Layers size={15} /><span>Back</span></button>
          <button onClick={() => reorder("back")} title="Send to back"><ArrowDownToLine size={15} /><span>Back</span></button>
        </div>
        <div className="insp-button-row">
          <button className="btn btn-ghost" onClick={duplicateSelection}><Copy size={13} /> Duplicate</button>
          <button className="btn btn-ghost" onClick={reSeedSelection}><RefreshCw size={13} /> Re-sketch</button>
        </div>
      </Section>
    </>
  );
}

function MultiInspector({ elements }: { elements: NapkinElement[] }) {
  const alignSelection = useStore((s) => s.alignSelection);
  const reorder = useStore((s) => s.reorder);
  const reSeedSelection = useStore((s) => s.reSeedSelection);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const removeElements = useStore((s) => s.removeElements);
  const selection = useStore((s) => s.selection);

  return (
    <>
      <div className="insp-identity">
        <span className="insp-type-glyph"><Layers size={18} /></span>
        <div>
          <h2>{elements.length} elements</h2>
          <p>Multiple selection</p>
        </div>
        <button className="icon-btn" onClick={() => removeElements(selection)} title="Delete selection">
          <Trash2 size={15} />
        </button>
      </div>

      <Section title="Align">
        <div className="align-grid">
          {([
            ["left", AlignHorizontalJustifyStart, "Left"],
            ["center", AlignHorizontalJustifyCenter, "Center"],
            ["right", AlignHorizontalJustifyEnd, "Right"],
            ["top", AlignVerticalJustifyStart, "Top"],
            ["middle", AlignVerticalJustifyCenter, "Middle"],
            ["bottom", AlignVerticalJustifyEnd, "Bottom"],
          ] as const).map(([mode, Icon, label]) => (
            <button key={mode} onClick={() => alignSelection(mode)} title={label}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Arrange">
        <div className="layer-actions">
          <button onClick={() => reorder("front")}><ArrowUpToLine size={15} /><span>Front</span></button>
          <button onClick={() => reorder("up")}><Layers size={15} /><span>Forward</span></button>
          <button onClick={() => reorder("down")}><Layers size={15} /><span>Back</span></button>
          <button onClick={() => reorder("back")}><ArrowDownToLine size={15} /><span>Back</span></button>
        </div>
      </Section>

      <Section title="Selection">
        <div className="insp-button-row">
          <button className="btn btn-ghost" onClick={duplicateSelection}><Copy size={13} /> Duplicate</button>
          <button className="btn btn-ghost" onClick={reSeedSelection}><RefreshCw size={13} /> Re-sketch</button>
        </div>
        <button className="btn btn-danger-ghost full" onClick={() => removeElements(selection)}><Trash2 size={13} /> Delete {elements.length} elements</button>
      </Section>
    </>
  );
}

function FrameInspector() {
  const frame = useSelectedFrame();
  const updateFrame = useStore((s) => s.updateFrame);
  const duplicateFrame = useStore((s) => s.duplicateFrame);
  const deleteFrame = useStore((s) => s.deleteFrame);
  const setExportOpen = useStore((s) => s.setExportOpen);
  const [name, setName] = useState(frame?.name ?? "");
  useEffect(() => setName(frame?.name ?? ""), [frame?.id, frame?.name]);
  if (!frame) return null;

  return (
    <>
      <div className="insp-identity">
        <span className="insp-type-glyph"><FrameIcon size={18} /></span>
        <div>
          <h2>Frame</h2>
          <p>{frame.w} × {frame.h} · {frame.elements.length} elements</p>
        </div>
        <button className="icon-btn" onClick={() => deleteFrame(frame.id)} title="Delete frame">
          <Trash2 size={15} />
        </button>
      </div>

      <Section title="Frame">
        <TextField
          label="Name"
          value={name}
          onCommit={(v) => {
            if (v.trim()) updateFrame(frame.id, { name: v.trim() });
          }}
        />
        <div className="num-grid">
          <NumField label="W" value={frame.w} min={120} onCommit={(w) => updateFrame(frame.id, { w })} />
          <NumField label="H" value={frame.h} min={120} onCommit={(h) => updateFrame(frame.id, { h })} />
        </div>
        <label className="toggle-row">
          <span>Device shell</span>
          <input
            type="checkbox"
            checked={frame.shell}
            onChange={(e) => updateFrame(frame.id, { shell: e.target.checked })}
          />
        </label>
      </Section>

      <Section title="Frame size">
        <div className="preset-mini-grid">
          {([
            ["Phone", 390, 844],
            ["Tablet", 820, 1180],
            ["Desktop", 1440, 900],
            ["Blank", 1080, 720],
          ] as const).map(([label, w, h]) => (
            <button
              key={label}
              className={frame.w === w && frame.h === h ? "active" : ""}
              onClick={() => updateFrame(frame.id, { w, h })}
            >
              <span>{label}</span>
              <small>{w} × {h}</small>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Frame actions">
        <button className="btn btn-ghost full" onClick={() => duplicateFrame(frame.id)}><Copy size={13} /> Duplicate frame</button>
        <button className="btn btn-ghost full" onClick={() => setExportOpen(true, [frame.id])}><Scan size={13} /> Export this frame</button>
        <button className="btn btn-ghost full" onClick={() => canvasApi.centerOnFrame(frame.id)}><Maximize size={13} /> Zoom to frame</button>
      </Section>
    </>
  );
}

function BoardInspector() {
  const project = useStore((s) => s.project);
  const sketchiness = useStore((s) => s.sketchiness);
  const setSketchiness = useStore((s) => s.setSketchiness);
  const grid = useStore((s) => s.grid);
  const setGrid = useStore((s) => s.setGrid);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const sceneElements = project.frames.reduce((n, f) => n + f.elements.length, 0);

  return (
    <>
      <div className="insp-identity">
        <span className="insp-type-glyph"><WandSparkles size={18} /></span>
        <div>
          <h2>Board</h2>
          <p>{project.name}</p>
        </div>
      </div>
      <Section title="Sketchiness">
        <div className="board-slider">
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={sketchiness}
            onChange={(e) => setSketchiness(Number(e.target.value))}
          />
          <div className="board-slider-labels"><span>Clean</span><span>Rough</span></div>
        </div>
        <label className="toggle-row">
          <span><Grid3X3 size={14} /> Dot grid</span>
          <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} />
        </label>
      </Section>
      <Section title="This napkin">
        <div className="stats-list">
          <div><b>{project.frames.length}</b><span>frames</span></div>
          <div><b>{sceneElements}</b><span>elements</span></div>
          <div><b>{sketchiness < 0.3 ? "Clean" : sketchiness < 1.4 ? "Medium" : "Heavy"}</b><span>style</span></div>
        </div>
        <button className="btn btn-primary full" onClick={() => setPaletteOpen(true)}>
          <Plus size={14} /> Add something
        </button>
        <button className="btn btn-ghost full" onClick={() => canvasApi.fitAll()}>
          <Maximize size={13} /> Fit all frames
        </button>
      </Section>
      <div className="insp-tip">
        <Sparkles size={15} />
        <p>Click a frame or element to edit it. Press <kbd>/</kbd> anywhere to add a part.</p>
      </div>
    </>
  );
}

export function Inspector() {
  const selection = useStore((s) => s.selection);
  const project = useStore((s) => s.project);
  const selectedFrame = useSelectedFrame();
  const open = useStore((s) => s.inspectorOpen);
  const setOpen = useStore((s) => s.setInspectorOpen);
  const selectedEl = useSelectedElement();

  const selectedElements = useMemo(() => {
    if (!selection.length) return [];
    const ids = new Set(selection);
    return project.frames.flatMap((f) => f.elements).filter((el) => ids.has(el.id));
  }, [selection, project.frames]);

  if (!open) {
    return (
      <button className="inspector-reopen" onClick={() => setOpen(true)} title="Open inspector">
        <Sparkles size={16} />
        <span>Inspector</span>
      </button>
    );
  }

  return (
    <aside className="inspector" aria-label="Inspector">
      <div className="insp-head">
        <span className="insp-eyebrow">{selectedElements.length ? "Selection" : selectedFrame && !selection.length ? "Frame" : "Napkin"}</span>
        <button className="icon-btn" onClick={() => setOpen(false)} title="Hide inspector">
          <X size={15} />
        </button>
      </div>
      <div className="insp-scroll">
        {selectedElements.length === 1 && selectedEl ? (
          <ElementInspector el={selectedEl} />
        ) : selectedElements.length > 1 ? (
          <MultiInspector elements={selectedElements} />
        ) : selectedFrame ? (
          <FrameInspector />
        ) : (
          <BoardInspector />
        )}
      </div>
      <div className="insp-foot">
        <Palette size={13} /> Changes save automatically
      </div>
    </aside>
  );
}
