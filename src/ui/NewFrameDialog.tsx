import { useEffect, useState } from "react";
import { Frame as FrameIcon, Monitor, Plus, Smartphone, Square, Tablet } from "lucide-react";
import { useStore } from "../store";
import type { Preset } from "../types";
import { canvasApi } from "../utils/canvasApi";
import { Modal, DialogHead } from "./Modal";

const PRESETS: { preset: Exclude<Preset, "custom">; label: string; w: number; h: number; icon: typeof Smartphone }[] = [
  { preset: "phone", label: "Phone", w: 390, h: 844, icon: Smartphone },
  { preset: "tablet", label: "Tablet", w: 820, h: 1180, icon: Tablet },
  { preset: "desktop", label: "Desktop", w: 1440, h: 900, icon: Monitor },
  { preset: "blank", label: "Blank", w: 1080, h: 720, icon: Square },
];

export function NewFrameDialog() {
  const onClose = () => useStore.getState().setNewFrameOpen(false);
  const addFrame = useStore((s) => s.addFrame);
  const updateFrame = useStore((s) => s.updateFrame);
  const [preset, setPreset] = useState<Preset>("phone");
  const [w, setW] = useState(390);
  const [h, setH] = useState(844);
  const [name, setName] = useState("");
  const [shell, setShell] = useState(true);

  useEffect(() => {
    const found = PRESETS.find((p) => p.preset === preset);
    if (found) {
      setW(found.w);
      setH(found.h);
      setShell(preset !== "blank");
    }
  }, [preset]);

  const create = () => {
    const width = Math.max(120, Math.min(4000, Math.round(w)));
    const height = Math.max(120, Math.min(4000, Math.round(h)));
    const frame = addFrame(preset, name.trim() || undefined, width, height);
    if (!shell) updateFrame(frame.id, { shell: false }, false);
    onClose();
    setTimeout(() => canvasApi.centerOnFrame(frame.id), 40);
  };

  return (
    <Modal onClose={onClose} className="newframe-dialog" label="New frame">
      <DialogHead
        eyebrow="New frame"
        title="What are we sketching?"
        subtitle="Pick a window class or dial in your own pixels. You can resize it later."
        onClose={onClose}
        icon={<FrameIcon size={19} />}
      />
      <div className="newframe-body">
        <div className="newframe-presets">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.preset} className={`newframe-preset ${preset === p.preset ? "active" : ""}`} onClick={() => setPreset(p.preset)}>
                <span className="newframe-preset-icon"><Icon size={25} strokeWidth={1.5} /></span>
                <b>{p.label}</b>
                <small>{p.w} × {p.h}</small>
              </button>
            );
          })}
        </div>

        <div className="newframe-form">
          <label className="insp-field">
            <span>Frame name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mobile screen 1" autoFocus />
          </label>
          <div className="newframe-size">
            <label className="insp-field">
              <span>Width</span>
              <input type="number" min={120} max={4000} value={w} onChange={(e) => { setPreset("custom"); setW(Number(e.target.value)); }} />
            </label>
            <span className="newframe-times">×</span>
            <label className="insp-field">
              <span>Height</span>
              <input type="number" min={120} max={4000} value={h} onChange={(e) => { setPreset("custom"); setH(Number(e.target.value)); }} />
            </label>
          </div>
          <label className="toggle-row">
            <span>Show a device shell</span>
            <input type="checkbox" checked={shell} onChange={(e) => setShell(e.target.checked)} />
          </label>
          <p className="newframe-note">A phone, tablet or browser bezel makes exports feel like real screens. Turn it off for a plain artboard.</p>
        </div>
      </div>
      <div className="newframe-foot">
        <span><kbd>F</kbd> opens this dialog next time</span>
        <div>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={create}><Plus size={14} /> Add frame</button>
        </div>
      </div>
    </Modal>
  );
}
