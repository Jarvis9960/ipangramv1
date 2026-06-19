import React from "react";
import { motion } from "framer-motion";

// A thin accent line that draws itself (stroke dash) as the panel reveals.
// Inherits "hidden"/"show" from the parent panel stagger; static when not animated.
export default function SelfDrawLine({ className = "", width = 54, animated = true }) {
  return (
    <svg className={className} width={width} height="2" viewBox={`0 0 ${width} 2`} fill="none" aria-hidden="true">
      {animated ? (
        <motion.line
          x1="0"
          y1="1"
          x2={width}
          y2="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0.3 },
            show: { pathLength: 1, opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
          }}
        />
      ) : (
        <line x1="0" y1="1" x2={width} y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}
