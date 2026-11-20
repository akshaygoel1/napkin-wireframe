import { SPECS } from "../data/components";
import { useStore } from "../store";
import type { ElementProps, ElementType, Frame } from "../types";
import { canvasApi } from "./canvasApi";
import { clamp } from "./geometry";

export interface InsertRect {
  frame: Frame;
  x: number;
  y: number;
  w: number;
  h: number;
  atPointer: boolean;
}

export function getInsertRect(type: ElementType, override?: { w?: number; h?: number; props?: ElementProps }): InsertRect | null {
  const state = useStore.getState();
  const spec = SPECS[type];
  if (!spec) return null;
  const pointer = canvasApi.pointerInsert();
  const frame =
    state.project.frames.find((f) => f.id === pointer?.frameId) ??
    state.project.frames.find((f) => f.id === state.selectedFrameId) ??
    state.project.frames[0];
  if (!frame) return null;

  const maxW = Math.max(48, frame.w - 32);
  const maxH = Math.max(24, frame.h - 32);
  let w = Math.round(Math.min(override?.w ?? spec.defaultW, maxW));
  let h = Math.round(Math.min(override?.h ?? spec.defaultH, maxH));
  w = Math.max(12, w);
  h = Math.max(8, h);

  let x: number;
  let y: number;
  let atPointer = false;

  if (pointer && pointer.frameId === frame.id) {
    x = pointer.x - w / 2;
    y = pointer.y - h / 2;
    atPointer = true;
  } else {
    // Stack below existing content, quick-add style
    const elements = frame.elements;
    const lowest = elements.reduce((m, el) => Math.max(m, el.y + el.h), 0);
    x = 16;
    y = elements.length ? lowest + 16 : 64;
    if (y + h > frame.h - 16) {
      x = Math.round((frame.w - w) / 2);
      y = Math.round((frame.h - h) / 2);
    }
  }

  x = clamp(Math.round(x), 8, Math.max(8, frame.w - w - 8));
  y = clamp(Math.round(y), 8, Math.max(8, frame.h - h - 8));
  return { frame, x, y, w, h, atPointer };
}

export function insertComponent(
  type: ElementType,
  props?: Partial<ElementProps>,
  override?: { w?: number; h?: number; select?: boolean },
) {
  const rect = getInsertRect(type, { w: override?.w, h: override?.h, props });
  if (!rect) {
    useStore.getState().showToast("Add a frame first, then drop something in");
    return null;
  }
  return useStore
    .getState()
    .insertElement(rect.frame.id, type, rect.x, rect.y, rect.w, rect.h, props, override?.select ?? true);
}

export function insertIconAtPointer(icon: string) {
  const state = useStore.getState();
  const iconProps: Partial<ElementProps> = {
    icon,
    iconStyle: state.iconSlot ? undefined : "rounded",
    iconFill: false,
    iconWeight: 400,
  };
  const el = insertComponent("icon", iconProps, { w: 36, h: 36 });
  if (el) {
    useStore.getState().showToast(`${icon.replace(/_/g, " ")} added`);
  }
}
