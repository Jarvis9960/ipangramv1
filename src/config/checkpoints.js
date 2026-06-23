import * as THREE from "three";

// World coordinates from the creative brief (Z deepens as the user scrolls).
export const OBJECT_POSITIONS = {
  heroNet: [0, 0, 4.5], // hero fly-through web, sits between camera and the hub
  neuralHub: [0, 0, 0], // hidden during hero (reveal factor); ~10u clear of circuit
  circuit: [-4, -1, -10],
  blocks: [5, 2, -20],
  pillars: [0, 0, -32],
  gears: [-6, -2, -44],
  avatar: [4, 1, -56],
  waveformOrb: [-3, 2, -68],
  brainNet: [2, -1, -80],
  cityBlock: [0, 0, -92],
  dashboards: [-2, 1, -104],
  helix: [0, 0, -118],
};

// 11 checkpoints. Progress is evenly spaced 0..1 so scroll<->jump mapping stays
// perfectly consistent. cameraPos/lookAt define the cinematic narrative rail.
const RAW = [
  // Beat 0 — HERO: camera sits in front of the network web; flies through it
  // (web fades) to land on the Neural Core Hub at beat 1. Overlay owns this beat.
  { cameraPos: [0, 0, 11], lookAt: [0, 0, 4], object: "heroNet", panel: "hero", accent: "#00D4FF" },
  { cameraPos: [0, 0, 4], lookAt: [0, 0, 0], object: "neuralHub", panel: "neuralCore", accent: "#00D4FF" },
  { cameraPos: [-1.5, 0.4, -5.5], lookAt: [-4, -1, -10], object: "circuit", panel: "scaleChanged", accent: "#F59E0B" },
  { cameraPos: [3, 1.4, -15], lookAt: [5, 2, -20], object: "blocks", panel: "systemsProblem", accent: "#F59E0B" },
  { cameraPos: [0, 1.6, -25], lookAt: [0, 0, -32], object: "pillars", panel: "fiveSystems", accent: "#00D4FF" },
  { cameraPos: [-3.6, -1, -37], lookAt: [-6, -2, -44], object: "gears", panel: "challenges", accent: "#F59E0B" },
  { cameraPos: [2.2, 1, -49.5], lookAt: [4, 1, -56], object: "avatar", panel: "framework", accent: "#7C3AED" },
  { cameraPos: [-1, 1.8, -61.5], lookAt: [-3, 2, -68], object: "waveformOrb", panel: "digitalWorkers", accent: "#00D4FF" },
  { cameraPos: [1, -0.6, -73.5], lookAt: [2, -1, -80], object: "brainNet", panel: "intellSystems", accent: "#00D4FF" },
  { cameraPos: [0, 3, -85], lookAt: [0, 0, -92], object: "cityBlock", panel: "industries", accent: "#2563EB" },
  { cameraPos: [-1, 1.4, -97.5], lookAt: [-2, 1, -104], object: "dashboards", panel: "whyHow", accent: "#2563EB" },
  { cameraPos: [0, 1.4, -111], lookAt: [0, 1.5, -118], object: "helix", panel: "finalCTA", accent: "#00D4FF" },
];

export const CHECKPOINTS = RAW.map((c, i) => ({
  ...c,
  index: i,
  progress: i / (RAW.length - 1),
}));

export const NUM_CHECKPOINTS = CHECKPOINTS.length;

function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Interpolate camera position + lookAt for a given global progress (0..1).
export function sampleRail(progress) {
  const cps = CHECKPOINTS;
  const p = Math.max(0, Math.min(1, progress));
  const span = 1 / (cps.length - 1);
  let i = Math.floor(p / span);
  if (i >= cps.length - 1) i = cps.length - 2;
  const a = cps[i];
  const b = cps[i + 1];
  const local = (p - a.progress) / (b.progress - a.progress);
  const t = easeInOut(Math.max(0, Math.min(1, local)));
  return { cameraPos: lerp3(a.cameraPos, b.cameraPos, t), lookAt: lerp3(a.lookAt, b.lookAt, t) };
}

// Nearest checkpoint index for a given progress (which object is in focus).
export function progressToIndex(progress) {
  const span = 1 / (CHECKPOINTS.length - 1);
  return Math.max(0, Math.min(CHECKPOINTS.length - 1, Math.round(progress / span)));
}

// Scroll progress (0..1) that corresponds to a checkpoint index, for jump nav.
export function indexToProgress(index) {
  const clamped = Math.max(0, Math.min(CHECKPOINTS.length - 1, index));
  return clamped / (CHECKPOINTS.length - 1);
}

// Focus factor 0..1 for an object index given current progress (1 = centered).
export function focusForIndex(progress, index) {
  const span = 1 / (CHECKPOINTS.length - 1);
  const cp = index * span;
  const d = Math.abs(progress - cp) / span;
  return Math.max(0, 1 - d);
}

export const VEC = (a) => new THREE.Vector3(a[0], a[1], a[2]);
