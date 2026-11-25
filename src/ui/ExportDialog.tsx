import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, FileArchive, Image as ImageIcon, TriangleAlert } from "lucide-react";
import { useStore } from "../store";
import type { Frame } from "../types";
import {
  copyFramePng,
  exportFrames,
  framePixelSize,
  loadExportOptions,
  saveExportOptions,
  slugify,
  tooLarge,
  type ExportOptions,
} from "../utils/exportFrames";
import { Modal, DialogHead } from "./Modal";
import { FrameThumb } from "./FrameThumb";

const SCALES: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

export function ExportDialog() {
  const onClose = () => useStore.getState().setExportOpen(false);
  const project = useStore((s) => s.project);
  const frameFilter = useStore((s) => s.exportFrameFilter);
  const showToast = useStore((s) => s.showToast);

  const [opts, setOpts] = useState<ExportOptions>(() => loadExportOptions());
  const [selected, setSelected] = useState<Set<string>>(() => {
    const ids = frameFilter?.length ? frameFilter : project.frames.map((f) => f.id);
    return new Set(ids);
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const frames = project.frames;
  const chosen = useMemo(() => frames.filter((f) => selected.has(f.id)), [frames, selected]);
  const oversized = chosen.filter((f) => tooLarge(f, opts.scale));
  const noFrames = frames.length === 0;

  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(frames.map((f) => f.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      if (!next.size && frames.length) {
        if (frameFilter?.length) frameFilter.forEach((id) => valid.has(id) && next.add(id));
        else frames.forEach((f) => next.add(f.id));
      }
      return next;
    });
  }, [frames, frameFilter]);

  const patch = (p: Partial<ExportOptions>) => setOpts((prev) => ({ ...prev, ...p }));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setCopied(false);
  };

  const allSelected = frames.length > 0 && chosen.length === frames.length;

  const filenames = useMemo(() => {
    const existing = new Set<string>();
    return chosen.map((f) => {
      const base = `${slugify(project.name)}-${slugify(f.name)}`;
      let name = `${base}.png`;
      let i = 2;
      while (existing.has(name)) {
        name = `${base}-${i}.png`;
        i++;
      }
      existing.add(name);
      return name;
    });
  }, [chosen, project.name]);

  const runExport = async () => {
    if (!chosen.length || busy) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    saveExportOptions(opts);
    try {
      const result = await exportFrames(project, chosen, opts, (done, total) => setProgress({ done, total }));
      onClose();
      showToast(
        result.count === 1
          ? "PNG downloaded"
          : `${result.count} PNGs downloaded as a ZIP`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed. Try a lower scale.");
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  const runCopy = async () => {
    if (chosen.length !== 1 || busy) return;
    setBusy(true);
    setError(null);
    saveExportOptions(opts);
    try {
      await copyFramePng(chosen[0], opts);
      setCopied(true);
      showToast("PNG copied to clipboard");
    } catch {
      setError("Clipboard copy was blocked. Try exporting the PNG instead.");
    } finally {
      setBusy(false);
    }
  };

  const firstTwo = filenames.slice(0, 2);

  return (
    <Modal onClose={onClose} className="export-dialog" label="Export frames">
      <DialogHead
        eyebrow="PNG export"
        title="Take it off the napkin"
        subtitle="Every frame leaves as its own crisp PNG. More than one becomes a ZIP."
        onClose={onClose}
        icon={<Download size={19} />}
      />

      {noFrames ? (
        <div className="export-empty">
          <div className="empty-face">:(</div>
          <h3>No frames yet.</h3>
          <p>Add a frame to the canvas, then come back to export it.</p>
          <button className="btn btn-primary" onClick={onClose}>Back to the canvas</button>
        </div>
      ) : (
        <>
          <div className="export-body">
            <section className="export-frames">
              <div className="export-section-head">
                <div>
                  <h3>Frames</h3>
                  <span>{chosen.length} of {frames.length} selected</span>
                </div>
                <div className="export-select-actions">
                  <button onClick={() => setSelected(new Set(frames.map((f) => f.id)))} disabled={allSelected}>All</button>
                  <button onClick={() => setSelected(new Set())} disabled={!chosen.length}>None</button>
                </div>
              </div>
              <div className="export-frame-list">
                {frames.map((frame) => {
                  const checked = selected.has(frame.id);
                  const size = framePixelSize(frame, opts.scale, opts.includeTitle);
                  const large = tooLarge(frame, opts.scale);
                  return (
                    <button
                      key={frame.id}
                      className={`export-frame ${checked ? "checked" : ""}`}
                      onClick={() => toggle(frame.id)}
                    >
                      <span className={`export-check ${checked ? "on" : ""}`}>{checked && <Check size={12} />}</span>
                      <FrameThumb frame={frame} width={66} height={76} showLabel={opts.includeTitle} />
                      <span className="export-frame-text">
                        <b>{frame.name}</b>
                        <small>{frame.w} × {frame.h} at 1x</small>
                        <em className={large ? "warn" : ""}>{size.w} × {size.h} px</em>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="export-options">
              <div className="export-section-head">
                <div>
                  <h3>Export settings</h3>
                  <span>Remembered next time</span>
                </div>
              </div>

              <div className="export-field">
                <span className="export-label">Scale</span>
                <div className="scale-seg">
                  {SCALES.map((s) => (
                    <button key={s} className={opts.scale === s ? "active" : ""} onClick={() => patch({ scale: s })}>
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="export-field">
                <span className="export-label">Background</span>
                <div className="background-options">
                  {([
                    ["transparent", "Transparent", "Checker"],
                    ["white", "White", "Clean"],
                    ["paper", "Paper", "Dot grid"],
                  ] as const).map(([value, label, hint]) => (
                    <button
                      key={value}
                      className={`bg-option ${opts.background === value ? "active" : ""}`}
                      onClick={() => patch({ background: value })}
                    >
                      <span className={`bg-swatch bg-${value}`} />
                      <b>{label}</b>
                      <small>{hint}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="export-field">
                <span className="export-label">Include</span>
                <label className="export-check-row">
                  <input type="checkbox" checked={opts.includeTitle} onChange={(e) => patch({ includeTitle: e.target.checked })} />
                  <span>Frame title and size above each image</span>
                </label>
                <label className="export-check-row">
                  <input type="checkbox" checked={opts.includeMarkup} onChange={(e) => patch({ includeMarkup: e.target.checked })} />
                  <span>Sticky notes and markup</span>
                </label>
              </div>

              <div className="filename-preview">
                <span className="export-label">Filenames</span>
                <code>{`{project}-{frame}.png`}</code>
                <div className="filename-list">
                  {firstTwo.map((name) => <span key={name}>{name}</span>)}
                  {filenames.length > 2 && <span className="more">+ {filenames.length - 2} more</span>}
                </div>
              </div>

              {oversized.length > 0 && (
                <div className="export-warning">
                  <TriangleAlert size={15} />
                  <span>{oversized[0].name} is over 8192 px at {opts.scale}×. Choose a lower scale.</span>
                </div>
              )}
              {error && <div className="export-error">{error}</div>}
            </section>
          </div>

          <div className="export-footer">
            <span className="export-foot-note">
              {chosen.length === 0
                ? "Select at least one frame."
                : chosen.length > 1
                  ? <><FileArchive size={13} /> One ZIP · {chosen.length} files</>
                  : <><ImageIcon size={13} /> One PNG</>}
            </span>
            <div className="export-actions">
              <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button
                className="btn btn-ghost"
                onClick={runCopy}
                disabled={busy || chosen.length !== 1 || oversized.length > 0}
                title="Copy the selected frame as a PNG"
              >
                <Clipboard size={14} /> {copied ? "Copied" : "Copy PNG"}
              </button>
              <button
                className="btn btn-primary"
                onClick={runExport}
                disabled={busy || chosen.length === 0 || oversized.length > 0}
              >
                <Download size={14} />
                {busy
                  ? `Exporting ${progress.done + 1 > progress.total ? progress.total : progress.done + 1} of ${progress.total || chosen.length}…`
                  : chosen.length > 1
                    ? `Export ${chosen.length} PNGs`
                    : "Export PNG"}
              </button>
            </div>
          </div>
          {busy && (
            <div className="export-progress" aria-live="polite">
              <span style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 8}%` }} />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
