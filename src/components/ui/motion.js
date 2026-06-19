// Shared framer-motion variants for the data panels.
export const panelVariants = {
  hidden: { opacity: 0, x: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07, delayChildren: 0.08 },
  },
  exit: { opacity: 0, x: 18, filter: "blur(4px)", transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
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
