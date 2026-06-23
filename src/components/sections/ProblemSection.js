import React from "react";
import { motion } from "framer-motion";
import { itemReveal } from "@/hooks/useScrollReveal";
import SectionShell from "@/components/sections/SectionShell";

export default function ProblemSection({ eyebrow, title, body, points = [] }) {
  return (
    <SectionShell>
      <div className="max-w-[780px]">
        {eyebrow && (
          <motion.p variants={itemReveal} className="panel-eyebrow mb-4">
            {eyebrow}
          </motion.p>
        )}
        <motion.h2 variants={itemReveal} className="sub-page-h2 font-display mb-6">
          {title}
        </motion.h2>
        {(Array.isArray(body) ? body : [body]).map((p, i) => (
          <motion.p key={i} variants={itemReveal} className="panel-body mb-4">
            {p}
          </motion.p>
        ))}
        {points.length > 0 && (
          <motion.ul variants={itemReveal} className="mt-6 space-y-2.5">
            {points.map((pt, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
                <span className="panel-body">{pt}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </SectionShell>
  );
}
