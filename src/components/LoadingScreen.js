import React, { useEffect, useState } from "react";
import { useSceneStore } from "@/store/useSceneStore";

// Cinematic loading screen (light theme).
// - pointer-events:none => it NEVER blocks interaction / hit-testing, so the
//   page is usable (and testable) immediately even if the overlay lingers
//   visually on a throttled/suspended page.
// - Unmounts on the `loaded` flag (JS timer) for capable browsers, and fades
//   out via CSS (compositor) as a visual nicety.
export default function LoadingScreen() {
  const setLoaded = useSceneStore((s) => s.setLoaded);
  const loaded = useSceneStore((s) => s.loaded);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const DURATION = 1800;
    const interval = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / DURATION) * 100));
      setPercent(p);
      if (p >= 100) clearInterval(interval);
    }, 60);
    const t = setTimeout(() => setLoaded(true), 2000);

    // Dismiss immediately on first deliberate interaction (also covers
    // headless/suspended pages that only run JS when externally driven).
    const dismiss = () => setLoaded(true);
    const events = ["pointerdown", "wheel", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, dismiss, { once: true, passive: true }));

    return () => {
      clearInterval(interval);
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, dismiss));
    };
  }, [setLoaded]);

  if (loaded) return null;

  // Self-assembling network: a core + ring of nodes whose links draw in and
  // nodes pop in, staggered — the "Living IT Ecosystem" forming on load.
  const C = [60, 60];
  const outer = [
    [98, 60], [79, 27], [41, 27], [22, 60], [41, 93], [79, 93],
  ];
  const spokes = outer.map((p) => [C, p]);
  const ring = outer.map((p, i) => [p, outer[(i + 1) % outer.length]]);
  const links = [...spokes, ...ring];

  return (
    <div
      data-testid="loading-overlay"
      className="loader-auto-dismiss fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#E6EAF1] pointer-events-none"
    >
      <div className="loading-vignette" />

      <svg className="loader-net relative mb-6" width="92" height="92" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        {links.map(([a, b], i) => (
          <line
            key={i}
            x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          />
        ))}
        {outer.map((p, i) => (
          <circle key={i} className="node" cx={p[0]} cy={p[1]} r="4.5" style={{ animationDelay: `${0.45 + i * 0.06}s` }} />
        ))}
        <circle className="core" cx={C[0]} cy={C[1]} r="7.5" style={{ animationDelay: "0.3s" }} />
      </svg>

      <div data-testid="loading-logo" className="relative text-[30px] sm:text-[38px] font-bold tracking-[-0.03em] text-[#10203A] logo-pulse">
        IPangram<span className="text-[#1A9C88]">.ai</span>
      </div>
      <p data-testid="loading-copy" className="relative mt-3 font-mono text-[11px] tracking-[0.18em] uppercase text-[#5B6A85]">
        Preparing your intelligent systems…
      </p>
      <div className="relative mt-7 w-[260px] h-[3px] rounded-full bg-[rgba(16,32,58,0.1)] overflow-hidden" data-testid="loading-progress">
        <div className="loader-bar-fill h-full bg-gradient-to-r from-[#1A9C88] to-[#27B6A1]" />
      </div>
      <p data-testid="loading-percent" className="relative mt-3 font-mono text-[11px] tabular-nums text-[#5B6A85]">
        {percent}%
      </p>
    </div>
  );
}
