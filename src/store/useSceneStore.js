import { create } from "zustand";
import { computeTier } from "@/lib/deviceTier";

const initial =
  typeof window !== "undefined"
    ? computeTier()
    : { tier: "low", isMobile: false, reducedMotion: false, webglEnabled: false, hasWebGL: false };

// Central scene state shared between the 3D canvas, panels, nav and cursor.
export const useSceneStore = create((set) => ({
  scrollProgress: 0,
  scrollVelocity: 0, // smoothed, normalized scroll speed (0..~1) for reactivity
  activeIndex: 0,
  qualityTier: initial.tier, // "high" | "mid" | "low"
  hovered: null, // hovered 3D object id or null
  pointer: { x: 0, y: 0 },
  loaded: false,
  reducedMotion: initial.reducedMotion,
  isMobile: initial.isMobile,
  webglEnabled: initial.webglEnabled,
  hasWebGL: initial.hasWebGL,
  jumpTarget: null,
  // drag-to-rotate interaction (orbit the focused object)
  dragging: false,
  dragInput: { x: 0, y: 0 },
  // cross-link selections between 3D objects and panels
  selection: { pillar: 0, industry: "healthcare", worker: null, gear: null },

  setScrollProgress: (p) => set({ scrollProgress: p }),
  setScrollVelocity: (v) => set({ scrollVelocity: v }),
  setActiveIndex: (i) => set({ activeIndex: i }),
  setQualityTier: (t) => set({ qualityTier: t }),
  setHovered: (h) => set({ hovered: h }),
  setPointer: (x, y) => set({ pointer: { x, y } }),
  setLoaded: (v) => set({ loaded: v }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setIsMobile: (v) => set({ isMobile: v }),
  setWebglEnabled: (v) => set({ webglEnabled: v }),
  setHasWebGL: (v) => set({ hasWebGL: v }),
  requestJump: (i) => set({ jumpTarget: i }),
  clearJump: () => set({ jumpTarget: null }),
  setDragging: (v) => set({ dragging: v }),
  setDragInput: (x, y) => set({ dragInput: { x, y } }),
  setSelection: (key, val) =>
    set((s) => ({ selection: { ...s.selection, [key]: val } })),
}));
