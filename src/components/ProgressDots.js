import React, { useState } from "react";
import { useSceneStore } from "@/store/useSceneStore";
import { CHECKPOINTS } from "@/config/checkpoints";
import { OBJECT_META } from "@/config/objectMeta";

// Left-edge scene progress indicator: 11 clickable dots (light theme).
export default function ProgressDots() {
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const requestJump = useSceneStore((s) => s.requestJump);
  const isMobile = useSceneStore((s) => s.isMobile);
  const [hover, setHover] = useState(null);

  if (isMobile) {
    // slim top progress bar on mobile
    const pct = ((activeIndex) / (CHECKPOINTS.length - 1)) * 100;
    return (
      <div className="fixed top-[68px] left-0 right-0 z-[55] h-[2px] bg-[rgba(16,32,58,0.07)]" data-testid="scene-progress-mobile">
        <div className="h-full bg-[#1A9C88] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    );
  }

  return (
    <div
      data-testid="scene-progress"
      className="fixed left-5 top-1/2 -translate-y-1/2 z-[55] flex flex-col items-center gap-3"
    >
      {CHECKPOINTS.map((cp, i) => {
        const active = i === activeIndex;
        const meta = OBJECT_META[cp.object];
        return (
          <div key={i} className="relative flex items-center">
            <button
              data-testid={`scene-progress-dot-${i}`}
              aria-label={`Go to ${meta?.name || "section"}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => requestJump(i)}
              className="cursor-hover grid place-items-center"
              style={{ width: 18, height: 18 }}
            >
              <span
                className="rounded-full transition-all duration-300"
                style={{
                  width: active ? 11 : hover === i ? 10 : 8,
                  height: active ? 11 : hover === i ? 10 : 8,
                  background: active ? "#1A9C88" : hover === i ? "#9FB0C8" : "#C7D2E2",
                  border: active ? "none" : "1px solid rgba(16,32,58,0.16)",
                  boxShadow: active ? "0 0 0 6px rgba(26,156,136,0.13)" : "none",
                  transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </button>
            {hover === i && (
              <div
                data-testid="scene-progress-tooltip"
                className="absolute left-7 whitespace-nowrap px-3 py-1.5 rounded-[10px] bg-[rgba(255,255,255,0.95)] border border-[rgba(16,32,58,0.1)] backdrop-blur-[10px] shadow-[0_8px_24px_-12px_rgba(16,32,58,0.28)] font-mono text-[10px] tracking-[0.12em] uppercase text-[#10203A]"
              >
                {meta?.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
