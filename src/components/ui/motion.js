// Shared framer-motion variants for the data panels.
// The panel slides in and orchestrates a staggered, spring-physics pop of its
// children every time a new beat becomes active (DataPanelHost remounts the
// shell per beat via AnimatePresence, so this re-fires on each scroll arrival).
export const panelVariants = {
  hidden: { opacity: 0, x: 34, filter: "blur(8px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.085,
      delayChildren: 0.14,
    },
  },
  exit: { opacity: 0, x: 26, filter: "blur(6px)", transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// Each child springs up + scales into place — a visible, tactile "pop" cascade.
export const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.92, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: { type: "spring", stiffness: 260, damping: 18, mass: 0.7 },
      scale: { type: "spring", stiffness: 260, damping: 18, mass: 0.7 },
      opacity: { duration: 0.3, ease: "easeOut" },
      filter: { duration: 0.4, ease: "easeOut" },
    },
  },
};

// Reduced-motion: minimal movement.
export const panelVariantsReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, staggerChildren: 0.02 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
export const itemVariantsReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};
