import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useSceneStore } from "@/store/useSceneStore";
import { PANELS } from "@/config/panelData";

// Full-bleed cinematic hero (beat 0). The glowing network sphere lives in the
// 3D canvas behind this overlay; here we lay the editorial type over it with a
// staggered word reveal, a sequenced sub-line + CTAs, and a scroll cue.
//
// The whole overlay fades + lifts away as the user scrolls into the journey
// (driven by scrollProgress, not a fixed timer) so the experience stays under
// the user's control. Reduced-motion users get the final state with no reveal.
export default function Hero() {
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const reduced = useSceneStore((s) => s.reducedMotion);
  const requestJump = useSceneStore((s) => s.requestJump);
  const rootRef = useRef(null);
  const data = PANELS.hero;

  // Fade/lift the hero out across the first slice of scroll. The camera flies
  // through the 3D HeroNetwork web (which fades via focus) and lands on the
  // Neural Core Hub at beat 1. The overlay is fully gone by ~0.045 — the point
  // where the active beat flips to 1 and the neuralCore panel takes over — so
  // the editorial type never clashes with the panel.
  const t = Math.min(1, scrollProgress / 0.045);
  const gone = t >= 1;

  // Intro reveal timeline on load (capable devices only).
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.4, defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { y: 18, opacity: 0, duration: 0.7 })
        .from(
          ".hero-word",
          { yPercent: 118, opacity: 0, duration: 0.95, stagger: 0.085 },
          "-=0.3"
        )
        .from(".hero-sub", { y: 22, opacity: 0, duration: 0.85 }, "-=0.45")
        .from(".hero-btn", { y: 18, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.5")
        .from(".hero-cue", { opacity: 0, y: 10, duration: 0.8 }, "-=0.25");
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  const words = data.title.split(" ");

  return (
    <div
      ref={rootRef}
      data-testid="hero-overlay"
      className="hero-overlay"
      style={{
        opacity: 1 - t,
        transform: `translateY(${-t * 42}px)`,
        visibility: gone ? "hidden" : "visible",
      }}
      aria-hidden={gone ? "true" : undefined}
    >
      {/* The 3D fly-through network (HeroNetwork) renders in the WebGL canvas
          behind this overlay; the scrim just lifts the type off the web. */}
      <div className="hero-scrim" />

      <div className="hero-content">
        <div className="hero-inner">
          <p className="hero-eyebrow">{data.eyebrow}</p>

          <h1 className="hero-headline" data-testid="hero-headline" aria-label={data.title}>
            {words.map((w, i) => (
              <span className="hero-word-mask" key={i} aria-hidden="true">
                <span className={`hero-word${i === words.length - 1 ? " accent" : ""}`}>
                  {w}
                </span>
              </span>
            ))}
          </h1>

          <p className="hero-sub" data-testid="hero-subheadline">
            {data.body}
          </p>

          <div className="hero-cta-row">
            <button
              type="button"
              data-testid="hero-primary-cta"
              className="hero-btn hero-btn-primary cursor-hover"
              onClick={() => requestJump(11)}
            >
              {data.ctas[0].label}
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              data-testid="hero-secondary-cta"
              className="hero-btn hero-btn-ghost cursor-hover"
              onClick={() => requestJump(1)}
            >
              {data.ctas[1].label}
            </button>
          </div>
        </div>
      </div>

      <div className="hero-cue" data-testid="hero-scroll-cue">
        <span>Scroll to explore</span>
        <ChevronDown className="hero-cue-chevron" size={18} strokeWidth={1.6} />
      </div>
    </div>
  );
}
