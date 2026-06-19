import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useScrollReveal, sectionVariants, itemReveal } from "@/hooks/useScrollReveal";

export default function PageHero({ eyebrow, title, subtitle, body, ctas = [] }) {
  const { ref, isInView } = useScrollReveal();

  return (
    <section className="sub-page-hero">
      <motion.div
        ref={ref}
        variants={sectionVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="sub-page-container"
      >
        <div className="max-w-[800px]">
          {eyebrow && (
            <motion.p variants={itemReveal} className="panel-eyebrow mb-5">
              {eyebrow}
            </motion.p>
          )}
          <motion.h1 variants={itemReveal} className="sub-page-h1 font-display">
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p variants={itemReveal} className="sub-page-lead mt-5 max-w-[640px]">
              {subtitle}
            </motion.p>
          )}
          {body && (
            <motion.div variants={itemReveal} className="mt-6 space-y-4">
              {(Array.isArray(body) ? body : [body]).map((p, i) => (
                <p key={i} className="panel-body">{p}</p>
              ))}
            </motion.div>
          )}
          {ctas.length > 0 && (
            <motion.div variants={itemReveal} className="hero-cta-row mt-8">
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
