import React from "react";
import { AnimatePresence } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { PANELS, PANEL_ORDER } from "@/config/panelData";
import PanelShell from "@/components/panels/PanelShell";

// Chooses and animates the active panel based on the focused checkpoint.
export default function DataPanelHost() {
  const activeIndex = useSceneStore((s) => s.activeIndex);

  // Beat 0 is owned by the full-bleed <Hero> overlay, so the right-side panel
  // stays hidden until the journey begins.
  if (activeIndex === 0) return null;

  const key = PANEL_ORDER[activeIndex] || PANEL_ORDER[0];
  const data = PANELS[key];

  return (
    <AnimatePresence mode="wait">
      <PanelShell key={key} data={data} />
    </AnimatePresence>
  );
}
