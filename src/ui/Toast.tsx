import { useEffect } from "react";
import { X } from "lucide-react";
import { useStore } from "../store";

export function Toast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, toast.action ? 6000 : 3800);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite" key={toast.id}>
      <span className="toast-dot" />
      <span className="toast-text">{toast.text}</span>
      {toast.action && (
        <button
          className="toast-action"
          onClick={() => {
            toast.onAction?.();
            clearToast();
          }}
        >
          {toast.action}
        </button>
      )}
      <button className="toast-close" onClick={clearToast} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  );
}
