import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  FolderOpen,
  Grid3X3,
  HelpCircle,
  Info,
  Keyboard,
  Maximize,
  Monitor,
  PencilLine,
  Redo2,
  Search,
  Share2,
  Smartphone,
  Square,
  Tablet,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useStore } from "../store";
import type { Preset } from "../types";
import { canvasApi } from "../utils/canvasApi";
import { MenuItem, MenuSeparator, Popover } from "./Popover";

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="logo-mark">
      <g transform="rotate(-3 14 14)">
        <rect x="3" y="3" width="22" height="22" rx="6.5" fill="#F0643C" />
        <path d="M17.5 3 H25 V10.6 Z" fill="#FFD9CB" opacity="0.95" />
        <path d="M8 18.2 q3.5 -2.4 7 0" fill="none" stroke="#FFF8F3" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
        <path d="M8 13.4 q2.4 -1.8 4.8 0" fill="none" stroke="#FFF8F3" strokeWidth="1.6" strokeLinecap="round" opacity="0.62" />
        <circle cx="21.4" cy="17.4" r="1.15" fill="#2A2733" opacity="0.9" />
      </g>
    </svg>
  );
}

function addFrameAndReveal(preset: Preset) {
  const f = useStore.getState().addFrame(preset);
  setTimeout(() => canvasApi.centerOnFrame(f.id), 30);
}

export function TopBar() {
  const project = useStore((s) => s.project);
  const selection = useStore((s) => s.selection);
  const selectedFrameId = useStore((s) => s.selectedFrameId);
  const past = useStore((s) => s.past.length);
  const future = useStore((s) => s.future.length);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const setExportOpen = useStore((s) => s.setExportOpen);
  const setShortcutsOpen = useStore((s) => s.setShortcutsOpen);
  const setNewFrameOpen = useStore((s) => s.setNewFrameOpen);
  const setAboutOpen = useStore((s) => s.setAboutOpen);
  const setGrid = useStore((s) => s.setGrid);
  const grid = useStore((s) => s.grid);
  const sketchiness = useStore((s) => s.sketchiness);
  const setSketchiness = useStore((s) => s.setSketchiness);
  const renameProject = useStore((s) => s.renameProject);
  const newProject = useStore((s) => s.newProject);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const removeElements = useStore((s) => s.removeElements);
  const copySelection = useStore((s) => s.copySelection);
  const pasteElements = useStore((s) => s.pasteElements);
  const selectAllInFrame = useStore((s) => s.selectAllInFrame);
  const reorder = useStore((s) => s.reorder);
  const downloadProject = useStore((s) => s.downloadProject);
  const importProject = useStore((s) => s.importProject);
  const showToast = useStore((s) => s.showToast);

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(project.name);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [renaming]);

  const startRename = () => {
    setDraft(project.name);
    setRenaming(true);
  };

  const commitRename = () => {
    if (draft.trim() && draft.trim() !== project.name) renameProject(draft.trim());
    setRenaming(false);
  };

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.frames) || data.version !== 1) throw new Error("Not a Napkin project");
      importProject(data);
      showToast("Project imported");
    } catch {
      showToast("That file doesn't look like a .napkin project");
    }
  };

  const selectedFrame = project.frames.find((f) => f.id === selectedFrameId);
  const exportFilter = selectedFrame && (selection.length > 0 || selectedFrameId) ? [selectedFrame.id] : null;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <LogoMark />
          <span className="brand-word">napkin</span>
        </div>
        <span className="topbar-divider" />
        <nav className="topbar-menus">
          <Popover label="Project" panelClass="menu-popover">
            {(close) => (
              <>
                <div className="menu-heading">Project</div>
                <MenuItem
                  icon={FileJson}
                  label="New napkin"
                  onClick={() => {
                    close();
                    newProject("blank");
                    showToast("New napkin created", "Undo", () => undo());
                  }}
                />
                <MenuItem
                  icon={Copy}
                  label="Open the demo board"
                  onClick={() => {
                    close();
                    newProject("demo");
                  }}
                />
                <MenuSeparator />
                <MenuItem
                  icon={Download}
                  label="Download .napkin file"
                  onClick={() => {
                    close();
                    downloadProject();
                  }}
                />
                <MenuItem
                  icon={Upload}
                  label="Import .napkin file…"
                  onClick={() => {
                    close();
                    fileRef.current?.click();
                  }}
                />
                <MenuSeparator />
                <MenuItem
                  icon={PencilLine}
                  label="Rename project…"
                  onClick={() => {
                    close();
                    startRename();
                  }}
                />
                <MenuItem
                  icon={Info}
                  label="About Napkin"
                  onClick={() => {
                    close();
                    setAboutOpen(true);
                  }}
                />
              </>
            )}
          </Popover>

          <Popover label="Board" panelClass="menu-popover">
            {(close) => (
              <>
                <div className="menu-heading">Add a frame</div>
                <MenuItem icon={Smartphone} label="Phone" shortcut="390 × 844" onClick={() => { close(); addFrameAndReveal("phone"); }} />
                <MenuItem icon={Tablet} label="Tablet" shortcut="820 × 1180" onClick={() => { close(); addFrameAndReveal("tablet"); }} />
                <MenuItem icon={Monitor} label="Desktop" shortcut="1440 × 900" onClick={() => { close(); addFrameAndReveal("desktop"); }} />
                <MenuItem icon={Square} label="Blank" shortcut="1080 × 720" onClick={() => { close(); addFrameAndReveal("blank"); }} />
                <MenuItem
                  icon={Maximize}
                  label="Custom size…"
                  onClick={() => {
                    close();
                    setNewFrameOpen(true);
                  }}
                />
                <MenuSeparator />
                <MenuItem icon={Maximize} label="Fit all frames" shortcut="⇧1" onClick={() => { close(); canvasApi.fitAll(); }} />
                <MenuItem
                  icon={Grid3X3}
                  label={grid ? "Hide dot grid" : "Show dot grid"}
                  shortcut={grid ? "On" : "Off"}
                  onClick={() => {
                    close();
                    setGrid(!grid);
                  }}
                />
              </>
            )}
          </Popover>

          <Popover label="Edit" panelClass="menu-popover">
            {(close) => (
              <>
                <MenuItem icon={Undo2} label="Undo" shortcut="⌘Z" disabled={!past} onClick={() => { close(); undo(); }} />
                <MenuItem icon={Redo2} label="Redo" shortcut="⇧⌘Z" disabled={!future} onClick={() => { close(); redo(); }} />
                <MenuSeparator />
                <MenuItem
                  icon={Copy}
                  label="Duplicate"
                  shortcut="⌘D"
                  disabled={!selection.length}
                  onClick={() => { close(); duplicateSelection(); }}
                />
                <MenuItem
                  icon={Copy}
                  label="Copy"
                  shortcut="⌘C"
                  disabled={!selection.length}
                  onClick={() => { close(); copySelection(); }}
                />
                <MenuItem
                  icon={ArrowDownToLine}
                  label="Paste"
                  shortcut="⌘V"
                  onClick={() => { close(); pasteElements(); }}
                />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  shortcut="⌫"
                  danger
                  disabled={!selection.length}
                  onClick={() => { close(); removeElements(selection); }}
                />
                <MenuSeparator />
                <MenuItem
                  icon={Check}
                  label="Select all in frame"
                  shortcut="⌘A"
                  onClick={() => { close(); selectAllInFrame(); }}
                />
                <MenuItem
                  icon={ArrowUpToLine}
                  label="Bring to front"
                  shortcut="]"
                  disabled={!selection.length}
                  onClick={() => { close(); reorder("front"); }}
                />
                <MenuItem
                  icon={ArrowDownToLine}
                  label="Send to back"
                  shortcut="["
                  disabled={!selection.length}
                  onClick={() => { close(); reorder("back"); }}
                />
              </>
            )}
          </Popover>

          <Popover label="View" panelClass="menu-popover">
            {(close) => (
              <>
                <MenuItem icon={ZoomIn} label="Zoom in" shortcut="⌘+" onClick={() => { close(); canvasApi.zoomBy(1.18); }} />
                <MenuItem icon={ZoomOut} label="Zoom out" shortcut="⌘−" onClick={() => { close(); canvasApi.zoomBy(1 / 1.18); }} />
                <MenuItem icon={Maximize} label="Fit all frames" shortcut="⇧1" onClick={() => { close(); canvasApi.fitAll(); }} />
                <MenuItem
                  icon={Search}
                  label="Zoom to 100%"
                  shortcut="⇧0"
                  onClick={() => {
                    close();
                    const v = useStore.getState().view;
                    const factor = 1 / v.zoom;
                    canvasApi.zoomBy(factor);
                  }}
                />
                <MenuSeparator />
                <MenuItem
                  icon={Grid3X3}
                  label={grid ? "Hide dot grid" : "Show dot grid"}
                  onClick={() => {
                    close();
                    setGrid(!grid);
                  }}
                />
                <div className="menu-range">
                  <div className="menu-range-head">
                    <span>Sketchiness</span>
                    <span className="menu-range-value">
                      {sketchiness <= 0.2 ? "Clean" : sketchiness < 1 ? "Light" : sketchiness < 2 ? "Medium" : "Heavy"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.1}
                    value={sketchiness}
                    onChange={(e) => setSketchiness(Number(e.target.value))}
                  />
                </div>
                <MenuSeparator />
                <MenuItem icon={Keyboard} label="Keyboard shortcuts" shortcut="?" onClick={() => { close(); setShortcutsOpen(true); }} />
              </>
            )}
          </Popover>
        </nav>
      </div>

      <div className="topbar-center">
        {renaming ? (
          <input
            ref={nameRef}
            className="project-name-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <button className="project-title" onClick={startRename} title="Click to rename this project">
            <span>{project.name}</span>
            <PencilLine size={12} className="project-pencil" />
          </button>
        )}
      </div>

      <div className="topbar-right">
        <button className="quick-add-pill" onClick={() => setPaletteOpen(true)} title="Quick add (/)">
          <Search size={14} />
          <span className="quick-add-text">Type <span className="quick-slash">/</span> or + to add</span>
          <kbd>/</kbd>
        </button>

        <Popover
          align="right"
          triggerClass="share-btn"
          panelClass="share-popover"
          label={<><Share2 size={14} /> <span>Share</span></>}
        >
          {(close) => (
            <>
              <div className="share-title">Share your napkin</div>
              <p className="share-copy">
                Napkin is local-first. Hand off an editable copy or export crisp PNGs — no account needed.
              </p>
              <button
                className="share-option"
                onClick={() => {
                  close();
                  downloadProject();
                }}
              >
                <span className="share-option-icon"><ArrowDownToLine size={16} /></span>
                <span>
                  <b>Editable copy</b>
                  <small>.napkin file, opens in Napkin</small>
                </span>
              </button>
              <button
                className="share-option"
                onClick={() => {
                  close();
                  setExportOpen(true, exportFilter);
                }}
              >
                <span className="share-option-icon"><Download size={16} /></span>
                <span>
                  <b>PNG images</b>
                  <small>Every frame, or just one</small>
                </span>
              </button>
              <div className="share-foot">Stored only in this browser · <button className="link-btn" onClick={() => { close(); setAboutOpen(true); }}>about</button></div>
            </>
          )}
        </Popover>

        <button className="export-btn" onClick={() => setExportOpen(true, exportFilter)} title="Export (⌘⇧E)">
          <Download size={14} />
          <span>Export</span>
        </button>

        <Popover
          align="right"
          triggerClass="avatar-btn"
          panelClass="profile-popover"
          title="Local workspace"
          label={<span className="avatar">A</span>}
        >
          {(close) => (
            <>
              <div className="profile-head">
                <span className="avatar avatar-lg">A</span>
                <div>
                  <div className="profile-name">Akshay</div>
                  <div className="profile-sub">Local workspace</div>
                </div>
              </div>
              <p className="profile-note">Everything saves automatically in this browser. No account, no cloud.</p>
              <MenuSeparator />
              <MenuItem icon={Keyboard} label="Keyboard shortcuts" shortcut="?" onClick={() => { close(); setShortcutsOpen(true); }} />
              <MenuItem icon={FolderOpen} label="Download backup" onClick={() => { close(); downloadProject(); }} />
              <MenuItem icon={HelpCircle} label="About Napkin" onClick={() => { close(); setAboutOpen(true); }} />
            </>
          )}
        </Popover>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".napkin,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importFile(file);
          e.target.value = "";
        }}
      />
    </header>
  );
}
