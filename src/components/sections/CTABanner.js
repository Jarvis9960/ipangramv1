import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useScrollReveal, sectionVariants, itemReveal } from "@/hooks/useScrollReveal";

export default function CTABanner({ title, body, ctas = [] }) {
  const { ref, isInView } = useScrollReveal();

  return (
    <section className="sub-page-section">
      <motion.div
        ref={ref}
        variants={sectionVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="sub-page-container"
      >
        <div className="glass-panel rounded-2xl p-8 sm:p-12 md:p-16 text-center max-w-[900px] mx-auto">
          <motion.h2
            variants={itemReveal}
            className="sub-page-h2 font-display mb-5"
          >
            {title}
          </motion.h2>
          {body && (
            <motion.p variants={itemReveal} className="panel-body max-w-[560px] mx-auto mb-8">
              {body}
            </motion.p>
          )}
          {ctas.length > 0 && (
            <motion.div
              variants={itemReveal}
              className="flex flex-wrap justify-center gap-4"
            >
              {ctas.map((cta, i) => (
                <Link
                  key={i}
                  to={cta.href}
                  className={`hero-btn ${
                    cta.variant === "primary" ? "hero-btn-primary" : "hero-btn-ghost"
                  }`}
                >
                  {cta.label}
                  {cta.variant === "primary" && <ArrowRight size={16} />}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
