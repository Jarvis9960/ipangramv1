import React, { useMemo } from "react";
import { useSceneStore } from "@/store/useSceneStore";
import { CHECKPOINTS } from "@/config/checkpoints";
import { OBJECT_META } from "@/config/objectMeta";

// Lightweight, dependency-free static scene used when WebGL is unavailable,
// in headless/no-GPU contexts, or when prefers-reduced-motion is set.
// Mirrors the cinematic mood with pure CSS so the page stays fully responsive.
export default function StaticScene() {
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const reduced = useSceneStore((s) => s.reducedMotion);
  const cp = CHECKPOINTS[activeIndex] || CHECKPOINTS[0];
  const accent = cp.accent || "#1A9C88";
  const meta = OBJECT_META[cp.object];

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 1,
        o: Math.random() * 0.5 + 0.15,
      })),
    []
  );

  return (
    <div className="static-scene" aria-hidden="true">
      {/* starfield */}
      <div className="static-stars">
        {stars.map((st, i) => (
          <span
            key={i}
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.s,
              height: st.s,
              opacity: st.o,
            }}
          />
        ))}
      </div>

      {/* central motif — color shifts with the active checkpoint */}
      <div className="static-motif" style={{ "--accent": accent }}>
        <div className={`static-ring r1 ${reduced ? "" : "spin"}`} style={{ borderColor: accent }} />
        <div className={`static-ring r2 ${reduced ? "" : "spin-rev"}`} style={{ borderColor: accent }} />
        <div className={`static-ring r3 ${reduced ? "" : "spin-slow"}`} style={{ borderColor: accent }} />
        <div className="static-core" style={{ background: accent, boxShadow: `0 0 60px 6px ${accent}33` }} />
        <div className="static-label">{meta?.name}</div>
      </div>

      {/* ambient glows */}
      <div className="static-glow g1" />
      <div className="static-glow g2" />
    </div>
  );
}
