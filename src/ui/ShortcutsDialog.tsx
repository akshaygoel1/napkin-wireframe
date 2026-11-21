import { Keyboard } from "lucide-react";
import { useStore } from "../store";
import { Modal, DialogHead } from "./Modal";

const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: "Add and place",
    rows: [
      ["Quick-add anything", "/ or +"],
      ["New frame", "F"],
      ["Icons", "I"],
      ["Text tool", "T"],
      ["Double-click artboard", "Add text"],
      ["Double-click bare canvas", "Quick-add"],
      ["Add and keep armed", "Shift + click"],
      ["Repeat duplicate", "⌘ / Ctrl + D"],
    ],
  },
  {
    title: "Canvas",
    rows: [
      ["Select / Hand", "V / H"],
      ["Pan", "Space + drag"],
      ["Zoom", "⌘ / Ctrl + scroll"],
      ["Fit all frames", "Shift + 1"],
      ["Zoom to selection", "Shift + 2"],
      ["Nudge / nudge by 8", "Arrows / Shift + arrows"],
    ],
  },
  {
    title: "Edit",
    rows: [
      ["Undo / redo", "⌘ / Ctrl + Z · ⇧Z"],
      ["Copy / paste", "⌘ / Ctrl + C · V"],
      ["Duplicate", "⌘ / Ctrl + D"],
      ["Bring forward / back", "] / ["],
      ["Right-click element", "Color · size · layer"],
      ["Delete selection", "⌫"],
      ["Select all in frame", "⌘ / Ctrl + A"],
    ],
  },
  {
    title: "Export",
    rows: [
      ["Export dialog", "⌘ / Ctrl + ⇧ + E"],
      ["Copy frame as PNG", "⌘ / Ctrl + ⇧ + C"],
      ["Close a dialog", "Esc"],
      ["Shortcut sheet", "?"],
    ],
  },
];

const SHORTCUTS: [string, string][] = [
  ["[ Label ]", "Button"],
  ["[x]", "Checkbox"],
  ["(o)", "Radio"],
  ["___", "Text field"],
  ["---", "Divider"],
  ["@home", "Icon"],
];

export function ShortcutsDialog() {
  const onClose = () => useStore.getState().setShortcutsOpen(false);
  return (
    <Modal onClose={onClose} className="shortcuts-dialog" label="Keyboard shortcuts">
      <DialogHead
        eyebrow="Keyboard first"
        title="The whole napkin, from the keys"
        subtitle="Everything clickable has a shortcut. These are the ones worth memorising."
        onClose={onClose}
        icon={<Keyboard size={19} />}
      />
      <div className="shortcuts-body">
        <div className="shortcut-groups">
          {GROUPS.map((group) => (
            <section key={group.title} className="shortcut-group">
              <h3>{group.title}</h3>
              {group.rows.map(([label, keys]) => (
                <div key={label} className="shortcut-row">
                  <span>{label}</span>
                  <kbd>{keys}</kbd>
                </div>
              ))}
            </section>
          ))}
        </div>
        <aside className="shortcut-syntax">
          <h3>Type it instead</h3>
          <p>Inside quick-add, these plain-text shortcuts turn into real components.</p>
          <div className="syntax-list">
            {SHORTCUTS.map(([syntax, result]) => (
              <button
                key={syntax}
                onClick={() => {
                  onClose();
                  useStore.getState().setPaletteOpen(true, syntax);
                }}
              >
                <code>{syntax}</code>
                <span>{result}</span>
              </button>
            ))}
          </div>
          <div className="syntax-tip">
            <b>Tip</b>
            <span>Double-click empty artboard space to drop a text box. Double-click bare canvas for quick-add.</span>
          </div>
        </aside>
      </div>
      <div className="shortcuts-foot">
        <span>Press <kbd>?</kbd> any time to bring this back.</span>
        <button className="btn btn-primary" onClick={onClose}>Got it</button>
      </div>
    </Modal>
  );
}
