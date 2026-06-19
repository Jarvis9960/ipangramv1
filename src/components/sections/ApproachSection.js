import React from "react";
import { motion } from "framer-motion";
import { itemReveal } from "@/hooks/useScrollReveal";
import SectionShell from "@/components/sections/SectionShell";

export default function ApproachSection({ eyebrow, title, body, items = [] }) {
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
        <motion.div variants={itemReveal} className="mb-10 max-w-[700px] space-y-4">
          {(Array.isArray(body) ? body : [body]).map((p, i) => (
            <p key={i} className="panel-body">{p}</p>
          ))}
        </motion.div>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div key={i} variants={itemReveal} className="glass-card p-6">
              <h3 className="sub-page-h3 mb-2">{item.title}</h3>
              <p className="text-[14px] text-[#5B6A85] leading-relaxed">{item.description}</p>
              {item.points && (
                <ul className="mt-3 space-y-1.5">
                  {item.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-[13.5px] text-[#5B6A85]">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[#1A9C88] shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
