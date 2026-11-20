import { Glyph, SketchProvider } from "../components/Sketch";
import { Wireframe } from "../components/Wireframe";
import type { Frame } from "../types";
import { frameBlockRect, shellMetrics } from "../utils/geometry";

const PRESET_GLYPH: Record<string, string> = {
  phone: "mobile",
  tablet: "tablet",
  desktop: "desktop_windows",
  blank: "crop_square",
  custom: "crop_square",
};

export function FrameThumb({
  frame,
  width = 78,
  height = 88,
  showLabel = true,
}: {
  frame: Frame;
  width?: number;
  height?: number;
  showLabel?: boolean;
}) {
  const m = shellMetrics(frame);
  const rect = frameBlockRect(frame);
  const scale = Math.min(width / rect.w, height / rect.h);
  return (
    <div className="frame-thumb" style={{ width, height }} aria-hidden>
      <div
        className="frame-thumb-inner"
        style={{ width: rect.w, height: rect.h, transform: `scale(${scale})` }}
      >
        {showLabel && (
          <div className="frame-thumb-label" style={{ height: m.labelH, paddingLeft: m.padX + 2 }}>
            <Glyph name={PRESET_GLYPH[frame.preset] ?? "crop_square"} size={11} />
            <span>{frame.name}</span>
            <small>{frame.w} × {frame.h}</small>
          </div>
        )}
        <div
          className={`frame-thumb-shell shell-${frame.shell ? frame.preset : "blank"}`}
          style={{
            position: "absolute",
            left: m.padX,
            top: m.padTop + (showLabel ? m.labelH : 0),
            width: frame.w,
            height: frame.h,
          }}
        >
          <div className="frame-thumb-browser" />
          <div className="frame-thumb-artboard">
            <SketchProvider roughness={1.05}>
              {frame.elements.map((el) => (
                <div
                  key={el.id}
                  className={["sticky", "callout", "arrow", "number", "hotspot"].includes(el.type) ? "markup-el" : ""}
                  style={{
                    position: "absolute",
                    left: el.x,
                    top: el.y,
                    width: el.w,
                    height: el.h,
                    fontFamily: "var(--font-hand)",
                  }}
                >
                  <Wireframe type={el.type} w={el.w} h={el.h} p={el.props} seed={el.seed} />
                </div>
              ))}
            </SketchProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
