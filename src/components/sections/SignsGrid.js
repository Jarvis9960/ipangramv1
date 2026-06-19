import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { itemReveal } from "@/hooks/useScrollReveal";
import SectionShell from "@/components/sections/SectionShell";

export default function SignsGrid({ eyebrow, title, subtitle, items = [] }) {
  return (
    <SectionShell>
      {eyebrow && (
        <motion.p variants={itemReveal} className="panel-eyebrow mb-4">
          {eyebrow}
        </motion.p>
      )}
      <motion.h2 variants={itemReveal} className="sub-page-h2 font-display mb-4">
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={itemReveal} className="panel-body mb-10 max-w-[640px]">
          {subtitle}
        </motion.p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={itemReveal}
            className="glass-card p-5 flex gap-4 items-start"
          >
            <AlertCircle size={20} className="text-[#D98A2B] shrink-0 mt-0.5" />
            <div>
              <h3 className="sub-page-h3 text-[15px] mb-1.5">{item.title}</h3>
              <p className="text-[14px] text-[#5B6A85] leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
