import { RotateCcw } from "lucide-react";
import { isPresetColor, PRESET_COLORS } from "../utils/color";

export function ColorField({
  value,
  onChange,
  compact,
}: {
  value?: string;
  onChange: (color?: string) => void;
  compact?: boolean;
}) {
  const custom = !!value && !isPresetColor(value);
  return (
    <div className={`color-field ${compact ? "is-compact" : ""}`}>
      <div className="color-swatches">
        {PRESET_COLORS.map((color) => {
          const active = !!value && value.toLowerCase() === color.value;
          return (
            <button
              key={color.value}
              type="button"
              className={`color-swatch ${active ? "is-active" : ""}`}
              style={{ background: color.value }}
              title={color.name}
              aria-label={color.name}
              aria-pressed={active}
              onClick={() => onChange(color.value)}
            />
          );
        })}
        <label
          className={`color-swatch color-custom ${custom ? "is-active" : ""}`}
          style={custom ? { background: value } : undefined}
          title="Custom color"
        >
          <input
            type="color"
            value={value ?? "#8f6b2c"}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Custom color"
          />
          <span aria-hidden>+</span>
        </label>
        <button
          type="button"
          className="color-reset"
          title="Reset to ink"
          aria-label="Reset to ink"
          onClick={() => onChange(undefined)}
          disabled={!value}
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
