import { Frame, Image, LayoutGrid, PenLine, Shapes, Sparkles, Type } from "lucide-react";
import { useStore } from "../store";

function ToolButton({
  icon: Icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  hint?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`tool-btn ${active ? "active" : ""}`} onClick={onClick} aria-label={label} aria-pressed={active}>
      <Icon size={20} strokeWidth={1.8} />
      <span className="tool-label">
        {label}
        {hint && <kbd>{hint}</kbd>}
      </span>
    </button>
  );
}

export function Toolbar() {
  const flyout = useStore((s) => s.flyout);
  const paletteOpen = useStore((s) => s.paletteOpen);
  const armed = useStore((s) => s.armed);
  const setFlyout = useStore((s) => s.setFlyout);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const setArmed = useStore((s) => s.setArmed);

  return (
    <aside className="toolbar" aria-label="Tools">
      <ToolButton
        icon={Sparkles}
        label="Quick add"
        hint="/"
        active={paletteOpen}
        onClick={() => setPaletteOpen(true)}
      />
      <span className="tool-divider" />
      <ToolButton
        icon={Shapes}
        label="Components"
        active={flyout === "components"}
        onClick={() => setFlyout("components")}
      />
      <ToolButton
        icon={LayoutGrid}
        label="Icons"
        hint="I"
        active={flyout === "icons"}
        onClick={() => setFlyout("icons")}
      />
      <ToolButton
        icon={Type}
        label="Text"
        hint="T"
        active={armed?.type === "text"}
        onClick={() => setArmed({ type: "text" })}
      />
      <ToolButton
        icon={Image}
        label="Images"
        active={flyout === "images"}
        onClick={() => setFlyout("images")}
      />
      <ToolButton
        icon={PenLine}
        label="Markup"
        active={flyout === "markup"}
        onClick={() => setFlyout("markup")}
      />
      <span className="tool-divider" />
      <ToolButton
        icon={Frame}
        label="Frames"
        hint="F"
        active={flyout === "frames"}
        onClick={() => setFlyout("frames")}
      />
    </aside>
  );
}
