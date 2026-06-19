import { useRef } from "react";
import { useInView } from "framer-motion";

export function useScrollReveal({ once = true, margin = "-80px" } = {}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin });
  return { ref, isInView };
}

export const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
    },
  },
};

export const itemReveal = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};
