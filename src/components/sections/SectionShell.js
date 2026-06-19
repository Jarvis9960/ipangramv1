import React from "react";
import { motion } from "framer-motion";
import { useScrollReveal, sectionVariants } from "@/hooks/useScrollReveal";

export default function SectionShell({ children, className = "", id }) {
  const { ref, isInView } = useScrollReveal();

  return (
    <section id={id} className={`sub-page-section ${className}`}>
      <motion.div
        ref={ref}
        variants={sectionVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="sub-page-container"
      >
        {children}
      </motion.div>
    </section>
  );
}
