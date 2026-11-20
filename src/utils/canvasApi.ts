import type { Point } from "../types";

type InsertContext = { frameId: string; x: number; y: number } | null;

export const frameRegistry = new Map<
  string,
  { block: HTMLDivElement; artboard: HTMLDivElement; shell: HTMLDivElement | null }
>();

export const canvasApi: {
  viewport: HTMLElement | null;
  fitAll: () => void;
  zoomBy: (factor: number, anchor?: Point) => void;
  centerOnFrame: (id: string) => void;
  revealFrame: (id: string) => void;
  pointerInsert: () => InsertContext;
  clientToWorld: (clientX: number, clientY: number) => Point | null;
  lastPointer: Point | null;
} = {
  viewport: null,
  fitAll: () => {},
  zoomBy: () => {},
  centerOnFrame: () => {},
  revealFrame: () => {},
  pointerInsert: () => null,
  clientToWorld: () => null,
  lastPointer: null,
};
