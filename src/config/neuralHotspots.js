import { C } from "@/config/theme";

// Annotation hotspots overlaid on the Neural Core Hub brain model (checkpoint 1).
// `anchor` is in NORMALISED model space (the model is recentred to the origin and
// scaled so its max dimension ~= 2.4 units in NeuralCoreHub). These are first
// guesses — fine-tune visually so each dot sits on the intended lobe.
// Copy echoes the "Five Systems" cards in config/panelData.js so the voice matches.
export const NEURAL_HOTSPOTS = [
  {
    num: 1,
    anchor: [-1.35, 0.45, 0.9],
    title: "Customer Growth Systems",
    body: "Attract, engage and convert customers on autopilot.",
    color: C.teal,
  },
  {
    num: 2,
    anchor: [1.35, 0.45, 0.9],
    title: "Business Operations Systems",
    body: "How work gets done — faster, consistent, profitable.",
    color: C.amber,
  },
  {
    num: 3,
    anchor: [0.0, 1.35, -0.4],
    title: "Operational Intelligence",
    body: "Real-time visibility that turns data into decisions.",
    color: C.blue,
  },
];
