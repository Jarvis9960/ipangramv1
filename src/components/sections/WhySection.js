import React from "react";
import { motion } from "framer-motion";
import { itemReveal } from "@/hooks/useScrollReveal";
import SectionShell from "@/components/sections/SectionShell";

export default function WhySection({ eyebrow, title, body, points = [] }) {
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
      {body && (
        <motion.div variants={itemReveal} className="mb-8 max-w-[700px] space-y-4">
          {(Array.isArray(body) ? body : [body]).map((p, i) => (
            <p key={i} className="panel-body">{p}</p>
          ))}
        </motion.div>
      )}
      {points.length > 0 && (
        <div className="space-y-4 max-w-[700px]">
          {points.map((pt, i) => (
            <motion.div key={i} variants={itemReveal} className="flex items-start gap-4">
              <span className="mt-1 w-6 h-6 rounded-full bg-[rgba(0,212,255,0.12)] flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF]" />
              </span>
              <div>
                <h3 className="sub-page-h3 mb-1">{pt.title}</h3>
                <p className="text-[14px] text-[#5B6A85] leading-relaxed">{pt.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
