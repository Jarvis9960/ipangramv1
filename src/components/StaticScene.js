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

  return (
    <div
      data-testid="loading-overlay"
      className="loader-auto-dismiss fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F4F6FB] pointer-events-none"
    >
      <div className="loading-vignette" />
      <div data-testid="loading-logo" className="relative text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] text-[#10203A] logo-pulse">
        IPangram<span className="text-[#00D4FF]">.ai</span>
      </div>
      <p data-testid="loading-copy" className="relative mt-3 font-mono text-[11px] tracking-[0.14em] uppercase text-[#5B6A85]">
        Preparing your intelligent systems…
      </p>
      <div className="relative mt-7 w-[260px] h-[3px] rounded-full bg-[rgba(16,32,58,0.1)] overflow-hidden" data-testid="loading-progress">
        <div className="loader-bar-fill h-full bg-[#00D4FF]" />
      </div>
      <p data-testid="loading-percent" className="relative mt-3 font-mono text-[11px] tabular-nums text-[#5B6A85]">
        {percent}%
      </p>
    </div>
  );
}
