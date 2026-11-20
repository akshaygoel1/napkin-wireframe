import {
  ChevronLeft,
  Copy,
  Download,
  Frame as FrameIcon,
  Maximize,
  Monitor,
  Plus,
  Smartphone,
  Square,
  Tablet,
  Trash2,
} from "lucide-react";
import { SPECS } from "../data/components";
import { useStore } from "../store";
import type { ElementType, Frame, Preset } from "../types";
import { canvasApi } from "../utils/canvasApi";
import { SketchProvider, Glyph } from "../components/Sketch";
import { Wireframe } from "../components/Wireframe";
import { FrameThumb } from "./FrameThumb";

const PRESETS: { preset: Exclude<Preset, "custom">; icon: typeof Smartphone; label: string; sub: string }[] = [
  { preset: "phone", icon: Smartphone, label: "Phone", sub: "390 × 844" },
  { preset: "tablet", icon: Tablet, label: "Tablet", sub: "820 × 1180" },
  { preset: "desktop", icon: Monitor, label: "Desktop", sub: "1440 × 900" },
  { preset: "blank", icon: Square, label: "Blank", sub: "1080 × 720" },
];

function PreviewTile({
  type,
  title,
  hint,
  variant,
}: {
  type: ElementType;
  title: string;
  hint: string;
  variant?: string;
}) {
  const setArmed = useStore((s) => s.setArmed);
  const armed = useStore((s) => s.armed);
  const spec = SPECS[type];
  const scale = Math.min(104 / spec.defaultW, 58 / spec.defaultH, 0.95);
  return (
    <button
      className={`media-tile ${armed?.type === type && (!variant || armed.variant === variant) ? "armed" : ""}`}
      onClick={() => setArmed({ type, variant })}
      title={`Place a ${title.toLowerCase()}`}
    >
      <span className="media-preview">
        <span
          style={{
            width: spec.defaultW,
            height: spec.defaultH,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            display: "block",
            position: "absolute",
            left: "50%",
            top: "50%",
          }}
        >
          <SketchProvider roughness={1.05}>
            <span style={{ position: "absolute", inset: 0, display: "block", fontFamily: "var(--font-hand)" }}>
              <Wireframe type={type} w={spec.defaultW} h={spec.defaultH} p={{ ...spec.defaults, ...(variant ? { variant } : {}) }} seed={13} />
            </span>
          </SketchProvider>
        </span>
      </span>
      <span className="media-tile-text">
        <b>{title}</b>
        <small>{hint}</small>
      </span>
    </button>
  );
}

export function ImageFlyout() {
  const setFlyout = useStore((s) => s.setFlyout);
  return (
    <aside className="flyout media-flyout" aria-label="Images and media">
      <div className="flyout-head">
        <div className="flyout-title">
          <span className="flyout-icon"><Glyph name="image" size={17} /></span>
          <h2>Images & media</h2>
        </div>
        <button className="icon-btn flyout-close" onClick={() => setFlyout(null)} aria-label="Close images">
          <ChevronLeft size={17} />
        </button>
      </div>
      <p className="flyout-intro">Low-fi placeholders that keep the conversation about layout, not pixels.</p>
      <div className="flyout-scroll">
        <div className="flyout-section-label">Media</div>
        <div className="media-grid">
          <PreviewTile type="image" title="Image" hint="Photo or illustration" />
          <PreviewTile type="video" title="Video" hint="Player with controls" />
          <PreviewTile type="map" title="Map" hint="Places and location" />
          <PreviewTile type="avatar" title="Avatar" hint="Person or profile" />
        </div>
        <div className="flyout-section-label">Data</div>
        <div className="media-grid">
          <PreviewTile type="chart" title="Chart" hint="Bars and trends" />
          <PreviewTile type="table" title="Table" hint="Rows and columns" />
          <PreviewTile type="carousel" title="Carousel" hint="Scrollable cards" />
        </div>
        <div className="flyout-section-label">Shapes</div>
        <div className="media-grid">
          <PreviewTile type="rectangle" title="Rectangle" hint="Plain box" />
          <PreviewTile type="circle" title="Circle" hint="Round shape" />
          <PreviewTile type="line" title="Line" hint="Divider or rule" />
        </div>
      </div>
      <div className="flyout-foot">
        Click a placeholder, then click or drag on the canvas. Hold <kbd>Shift</kbd> to keep placing.
      </div>
    </aside>
  );
}

export function MarkupFlyout() {
  const setFlyout = useStore((s) => s.setFlyout);
  return (
    <aside className="flyout markup-flyout" aria-label="Markup">
      <div className="flyout-head">
        <div className="flyout-title">
          <span className="flyout-icon"><Glyph name="sticky_note_2" size={17} /></span>
          <h2>Markup</h2>
        </div>
        <button className="icon-btn flyout-close" onClick={() => setFlyout(null)} aria-label="Close markup">
          <ChevronLeft size={17} />
        </button>
      </div>
      <p className="flyout-intro">Notes and annotations for reviews. Markup stays out of PNG exports unless you ask for it.</p>
      <div className="flyout-scroll">
        <div className="media-grid markup-grid">
          <PreviewTile type="sticky" title="Sticky note" hint="A thought worth keeping" />
          <PreviewTile type="callout" title="Callout" hint="Point at a detail" />
          <PreviewTile type="arrow" title="Arrow" hint="Connect two ideas" />
          <PreviewTile type="number" title="Number marker" hint="Step through a flow" />
          <PreviewTile type="hotspot" title="Hotspot" hint="A clickable area" />
        </div>
        <div className="markup-tip">
          <Glyph name="lightbulb" size={18} />
          <p><b>Try it:</b> drag an arrow between two frames to explain a transition, then tick “Include markup” in the export dialog when you want it in the PNG.</p>
        </div>
      </div>
      <div className="flyout-foot">Sticky notes are yellow by default so they never get confused with UI.</div>
    </aside>
  );
}

function presetIcon(preset: Preset) {
  if (preset === "phone") return Smartphone;
  if (preset === "tablet") return Tablet;
  if (preset === "desktop") return Monitor;
  return Square;
}

function addAndReveal(preset: Preset) {
  const frame = useStore.getState().addFrame(preset);
  setTimeout(() => canvasApi.centerOnFrame(frame.id), 30);
}

export function FramesFlyout() {
  const setFlyout = useStore((s) => s.setFlyout);
  const frames = useStore((s) => s.project.frames);
  const selectedFrameId = useStore((s) => s.selectedFrameId);
  const selectFrame = useStore((s) => s.selectFrame);
  const deleteFrame = useStore((s) => s.deleteFrame);
  const duplicateFrame = useStore((s) => s.duplicateFrame);
  const setExportOpen = useStore((s) => s.setExportOpen);
  const setNewFrameOpen = useStore((s) => s.setNewFrameOpen);

  const reveal = (frame: Frame) => {
    selectFrame(frame.id);
    canvasApi.centerOnFrame(frame.id);
  };

  return (
    <aside className="flyout frames-flyout" aria-label="Frames">
      <div className="flyout-head">
        <div className="flyout-title">
          <span className="flyout-icon"><FrameIcon size={17} /></span>
          <h2>Frames</h2>
          <span className="flyout-count">{frames.length}</span>
        </div>
        <button className="icon-btn flyout-close" onClick={() => setFlyout(null)} aria-label="Close frames">
          <ChevronLeft size={17} />
        </button>
      </div>

      <div className="flyout-scroll">
        <div className="flyout-section-label">Add a frame</div>
        <div className="preset-grid">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.preset} className="preset-tile" onClick={() => addAndReveal(p.preset)}>
                <span className="preset-icon"><Icon size={22} strokeWidth={1.6} /></span>
                <span>
                  <b>{p.label}</b>
                  <small>{p.sub}</small>
                </span>
              </button>
            );
          })}
          <button
            className="preset-tile preset-custom"
            onClick={() => {
              setNewFrameOpen(true);
              setFlyout(null);
            }}
          >
            <span className="preset-icon"><Plus size={22} strokeWidth={1.6} /></span>
            <span>
              <b>Custom size</b>
              <small>Set your own pixels</small>
            </span>
          </button>
        </div>

        <div className="frames-list-head">
          <span className="flyout-section-label">On this canvas</span>
          <button className="link-btn" onClick={() => canvasApi.fitAll()}>
            <Maximize size={12} /> Fit all
          </button>
        </div>

        {frames.length === 0 && (
          <div className="flyout-empty frames-empty">
            <div className="empty-face">:(</div>
            <p>No frames yet.</p>
            <span>Pick a preset above to start your first screen.</span>
          </div>
        )}

        <div className="frames-list">
          {frames.map((frame) => {
            const Icon = presetIcon(frame.preset);
            return (
              <div key={frame.id} className={`frame-row ${selectedFrameId === frame.id ? "selected" : ""}`}>
                <button className="frame-row-main" onClick={() => reveal(frame)}>
                  <FrameThumb frame={frame} width={58} height={64} showLabel={false} />
                  <span className="frame-row-text">
                    <b>{frame.name}</b>
                    <small><Icon size={11} /> {frame.w} × {frame.h}</small>
                  </span>
                </button>
                <span className="frame-row-actions">
                  <button
                    className="icon-btn"
                    title="Export this frame"
                    onClick={() => setExportOpen(true, [frame.id])}
                  >
                    <Download size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    title="Duplicate frame"
                    onClick={() => duplicateFrame(frame.id)}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Delete frame"
                    onClick={() => deleteFrame(frame.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flyout-foot">
        Drag a frame by its label to move it. Press <kbd>F</kbd> to add another.
      </div>
    </aside>
  );
}
