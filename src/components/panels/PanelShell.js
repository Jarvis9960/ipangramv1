import React from "react";
import { motion } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { panelVariants } from "@/components/ui/motion";
import PanelContent from "@/components/panels/PanelContent";

// The glass shell that hosts the active panel content (responsive).
// Animated slide-in on GPU-backed tiers; static (always visible) on low tier
// or reduced motion so content never gets stuck behind a stalled animation.
export default function PanelShell({ data }) {
  const isMobile = useSceneStore((s) => s.isMobile);
  const reduced = useSceneStore((s) => s.reducedMotion);
  const tier = useSceneStore((s) => s.qualityTier);
  const animated = tier !== "low" && !reduced;

  const desktopWrap =
    "fixed right-6 top-[88px] bottom-6 z-[50] w-[38vw] max-w-[520px] min-w-[400px] pointer-events-auto";
  const mobileWrap = "fixed left-0 right-0 bottom-0 z-[50] px-3 pb-3 pointer-events-auto";
  const wrapClass = isMobile ? mobileWrap : desktopWrap;

  const inner = isMobile
    ? "glass-panel rounded-[18px] max-h-[56vh] flex flex-col overflow-hidden"
    : "glass-panel rounded-[18px] h-full flex flex-col overflow-hidden";
  const scrollPad = isMobile ? "p-5" : "p-7";

  const body = (
    <div className={inner}>
      <div className={`panel-scroll flex-1 overflow-y-auto ${scrollPad}`} data-lenis-prevent>
        <PanelContent data={data} animated={animated} />
      </div>
    </div>
  );

  if (!animated) {
    return (
      <section data-testid="right-data-panel" className={wrapClass} role="region" aria-label={data.title}>
        {body}
      </section>
    );
  }

  return (
    <motion.section
      data-testid="right-data-panel"
      variants={panelVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={wrapClass}
      role="region"
      aria-label={data.title}
    >
      {body}
    </motion.section>
  );
}
