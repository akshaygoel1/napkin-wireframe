import { Download, Heart, Keyboard, Sparkles } from "lucide-react";
import { useStore } from "../store";
import { Modal } from "./Modal";

export function AboutDialog() {
  const onClose = () => useStore.getState().setAboutOpen(false);
  const downloadProject = useStore((s) => s.downloadProject);
  const setShortcutsOpen = useStore((s) => s.setShortcutsOpen);

  return (
    <Modal onClose={onClose} className="about-dialog" label="About Napkin">
      <div className="about-hero">
        <div className="about-mark">
          <span>n</span>
          <i />
        </div>
        <div>
          <span className="dialog-eyebrow">About</span>
          <h2>Napkin</h2>
          <p>A wireframe is a thinking tool. This one is built to keep up.</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close about">×</button>
      </div>

      <div className="about-body">
        <p className="about-lede">
          Balsamiq's feel, Material 3's parts, a napkin's speed. Napkin is a local-first place to sketch
          phone, tablet and desktop screens side by side and send each one out as a crisp PNG.
        </p>
        <div className="about-grid">
          <div>
            <h3>Local-first by design</h3>
            <p>Every change saves in this browser. No account, no cloud, no waiting. Download a <code>.napkin</code> file when you want a backup.</p>
          </div>
          <div>
            <h3>Rough on purpose</h3>
            <p>Strokes are seeded, so a shape never re-jitters. The sketchiness slider goes from clean to properly hand-drawn.</p>
          </div>
          <div>
            <h3>Built from real parts</h3>
            <p>Components are Material 3-inspired and stay grayscale, so reviews stay about flow and structure.</p>
          </div>
          <div>
            <h3>Export is one step</h3>
            <p>One frame becomes one PNG. Several become a ZIP. Pick 1×–4×, transparent or paper, sketchy or clean.</p>
          </div>
        </div>

        <div className="about-credits">
          <h3>With thanks</h3>
          <p>
            Material Symbols (Apache 2.0) · Rough.js (MIT) · Balsamiq Sans (OFL) · Inter (OFL).
            Napkin is an independent prototype and is not endorsed by Google or Balsamiq.
          </p>
        </div>
      </div>

      <div className="about-foot">
        <span className="about-version"><Sparkles size={13} /> v1.0 · made for quick thinking</span>
        <div>
          <button className="btn btn-ghost" onClick={() => { onClose(); setShortcutsOpen(true); }}>
            <Keyboard size={14} /> Shortcuts
          </button>
          <button className="btn btn-primary" onClick={() => { downloadProject(); }}>
            <Download size={14} /> Download backup
          </button>
        </div>
      </div>
      <div className="about-maker">Made with <Heart size={12} /> on a napkin</div>
    </Modal>
  );
}
