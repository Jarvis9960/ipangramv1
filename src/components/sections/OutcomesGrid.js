import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { itemReveal } from "@/hooks/useScrollReveal";
import SectionShell from "@/components/sections/SectionShell";

export default function OutcomesGrid({ eyebrow, title, items = [] }) {
  return (
    <SectionShell>
      {eyebrow && (
        <motion.p variants={itemReveal} className="panel-eyebrow mb-4">
          {eyebrow}
        </motion.p>
      )}
      <motion.h2 variants={itemReveal} className="sub-page-h2 font-display mb-8">
        {title}
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, i) => (
          <motion.div key={i} variants={itemReveal} className="glass-card p-6">
            <div className="w-9 h-9 rounded-lg bg-[rgba(217,138,43,0.1)] flex items-center justify-center mb-4">
              <TrendingUp size={18} className="text-[#D98A2B]" />
            </div>
            <h3 className="sub-page-h3 mb-2">{item.title}</h3>
            <p className="text-[14px] text-[#5B6A85] leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
