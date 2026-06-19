import React from "react";
import { motion } from "framer-motion";

// Expressive word-by-word heading reveal. Each word rises out of a clip mask;
// it participates in the parent panel's framer-motion stagger (the panel section
// drives "hidden"/"show"), so headings reveal as each beat becomes active.
// On non-animated tiers it renders as plain static text.
const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const wordV = {
  hidden: { y: "115%" },
  show: { y: 0, transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] } },
};

export default function AnimatedHeading({ text = "", as = "h2", className = "", testid, animated = true }) {
  const Tag = as;
  if (!animated) {
    return (
      <Tag className={className} data-testid={testid}>
        {text}
      </Tag>
    );
  }
  const M = motion[as] || motion.h2;
  const words = String(text).split(" ");
  // aria-label carries the full text; the per-word spans are decorative so
  // screen readers read the heading normally (not as one run-on word).
  return (
    <M className={className} data-testid={testid} variants={containerV} aria-label={text}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="ah-mask" aria-hidden="true">
            <motion.span className="ah-word" variants={wordV}>
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </M>
  );
}
