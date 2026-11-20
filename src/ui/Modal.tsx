import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  children,
  onClose,
  className = "",
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  label?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`dialog ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

export function DialogHead({
  eyebrow,
  title,
  subtitle,
  onClose,
  icon,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="dialog-head">
      {icon && <span className="dialog-head-icon">{icon}</span>}
      <div className="dialog-head-text">
        {eyebrow && <div className="dialog-eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <button className="icon-btn dialog-close" onClick={onClose} aria-label="Close dialog">
        <X size={18} />
      </button>
    </div>
  );
}
