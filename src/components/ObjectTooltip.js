import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useSceneStore } from "@/store/useSceneStore";
import { OBJECT_META } from "@/config/objectMeta";

// Floating tooltip that follows the cursor when hovering a 3D object (light).
export default function ObjectTooltip() {
  const hovered = useSceneStore((s) => s.hovered);
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const isMobile = useSceneStore((s) => s.isMobile);
  const [p, setP] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => setP({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  if (isMobile || !hovered) return null;
  const meta = OBJECT_META[hovered];
  // Only label the object that belongs to the active beat — overlapping
  // neighbours caught by the raycaster would otherwise show the wrong name.
  if (!meta || meta.index !== activeIndex) return null;

  return (
    <div
      data-testid="object-hover-tooltip"
      className="pointer-events-none fixed z-[190] px-3 py-2 rounded-[12px] bg-[rgba(255,255,255,0.95)] border border-[rgba(16,32,58,0.12)] backdrop-blur-[12px] shadow-[0_8px_24px_-12px_rgba(16,32,58,0.3)] flex items-center gap-2"
      style={{ left: p.x + 18, top: p.y + 18 }}
    >
      <span data-testid="object-hover-tooltip-title" className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#10203A]">
        {meta.name}
      </span>
      <ArrowUpRight size={13} className="text-[#1A9C88]" />
    </div>
  );
}
