import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useStore } from "../store";
import { importImageFiles } from "../utils/images";

export function ImageImportButton({
  elementId,
  label = "Import image",
}: {
  elementId: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const showToast = useStore((s) => s.showToast);

  return (
    <>
      <button
        className="btn btn-ghost image-import-btn"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <Upload size={14} />
        {busy ? "Importing…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="file-input-hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            await importImageFiles(files, { elementId });
          } catch {
            showToast("That image could not be read");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
