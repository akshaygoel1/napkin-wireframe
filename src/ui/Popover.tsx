import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Popover({
  label,
  children,
  className,
  panelClass,
  align = "left",
  triggerClass,
  title,
}: {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  panelClass?: string;
  align?: "left" | "right";
  triggerClass?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className={`popover-anchor ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        className={triggerClass ?? "topbar-menu-trigger"}
        title={title}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div className={`popover-panel ${align === "right" ? "align-right" : ""} ${panelClass ?? ""}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  danger,
  disabled,
  checked,
}: {
  icon?: LucideIcon;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
}) {
  return (
    <button
      type="button"
      className={`menu-item ${danger ? "danger" : ""} ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="menu-item-icon">{Icon ? <Icon size={15} /> : checked ? <span className="menu-check">✓</span> : null}</span>
      <span className="menu-item-label">{label}</span>
      {shortcut && <span className="menu-shortcut">{shortcut}</span>}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="menu-sep" />;
}
