import { Maximize, Minus, Monitor, Plus, Smartphone, Square, Tablet } from "lucide-react";
import { useStore } from "../store";
import type { Preset } from "../types";
import { canvasApi } from "../utils/canvasApi";

const PRESETS: { preset: Exclude<Preset, "custom">; label: string; icon: typeof Smartphone }[] = [
  { preset: "phone", label: "Phone", icon: Smartphone },
  { preset: "tablet", label: "Tablet", icon: Tablet },
  { preset: "desktop", label: "Desktop", icon: Monitor },
  { preset: "blank", label: "Blank", icon: Square },
];

export function BottomBar() {
  const view = useStore((s) => s.view);
  const frames = useStore((s) => s.project.frames);
  const setNewFrameOpen = useStore((s) => s.setNewFrameOpen);

  const add = (preset: Preset) => {
    const frame = useStore.getState().addFrame(preset);
    setTimeout(() => canvasApi.centerOnFrame(frame.id), 30);
  };

  return (
    <footer className="bottombar" aria-label="Canvas controls">
      <div className="bottom-add">
        <span className="bottom-label">Add frame</span>
        {PRESETS.map((p) => {
          const Icon = p.icon;
          return (
            <button key={p.preset} className="bottom-preset" onClick={() => add(p.preset)} title={`Add ${p.label.toLowerCase()} frame`}>
              <Icon size={15} strokeWidth={1.7} />
              <span>{p.label}</span>
            </button>
          );
        })}
        <button className="bottom-preset bottom-custom" onClick={() => setNewFrameOpen(true)} title="Custom frame size">
          <Plus size={15} />
        </button>
      </div>
      <span className="bottom-divider" />
      <div className="bottom-zoom">
        <button className="zoom-btn" onClick={() => canvasApi.zoomBy(1 / 1.2)} title="Zoom out">
          <Minus size={14} />
        </button>
        <button
          className="zoom-value"
          title="Reset to 100%"
          onClick={() => {
            const current = useStore.getState().view.zoom;
            canvasApi.zoomBy(1 / current);
          }}
        >
          {Math.round(view.zoom * 100)}%
        </button>
        <button className="zoom-btn" onClick={() => canvasApi.zoomBy(1.2)} title="Zoom in">
          <Plus size={14} />
        </button>
        <button className="zoom-btn zoom-fit" onClick={() => canvasApi.fitAll()} title="Fit all frames (Shift+1)">
          <Maximize size={14} />
        </button>
      </div>
      <span className="bottom-divider" />
      <span className="bottom-count">{frames.length} {frames.length === 1 ? "frame" : "frames"}</span>
    </footer>
  );
}
