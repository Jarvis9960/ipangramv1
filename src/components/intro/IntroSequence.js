import React, { useEffect, useRef } from "react";
import { useSceneStore } from "@/store/useSceneStore";
import { FRAME_COUNT, INTRO_VH } from "@/config/intro";

// ===== Cinematic scroll-driven video frame sequence (the opening act) =====
//
// Apple-style "scrubbing": instead of playing the clip, we draw a single
// pre-extracted JPG frame onto a canvas and advance the frame index with scroll.
// A rAF loop eases the rendered frame toward the scroll-derived target frame, so
// the motion stays buttery even when the raw scroll input is coarse.
//
// Over the frames, four editorial beats fade in/out in sequence:
//   Build (top-left) -> Automate (center) -> Scale (bottom-right) -> IPANGRAM.AI
// The layer is `position: fixed` and pinned for the whole intro band; only once
// IPANGRAM.AI has fully arrived and held does the layer cross-fade out to hand
// off to the hero (it never slides away mid-word).

const framePath = (i) =>
  `${process.env.PUBLIC_URL || ""}/frames/${String(i + 1).padStart(4, "0")}.jpg`;

// Smooth 0->1->0 window: ramps in over [start, start+fade], holds, ramps out over
// [end-fade, end]. Outside [start, end] it's 0. Cosine easing on each ramp.
function fadeWindow(p, start, end, fade) {
  if (p <= start || p >= end) return 0;
  const inT = Math.min(1, (p - start) / fade);
  const outT = Math.min(1, (end - p) / fade);
  const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));
  return Math.min(ease(inT), ease(outT));
}

// Fade-in-and-hold (no fade-out) — used for the final IPANGRAM.AI beat.
function fadeInHold(p, start, fade) {
  const t = Math.min(1, Math.max(0, (p - start) / fade));
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

// The three transient beats. `pos` maps to a CSS modifier class. They all finish
// before the final IPANGRAM.AI beat arrives.
const BEATS = [
  { text: "Build", pos: "is-tl", start: 0.05, end: 0.25, fade: 0.07 },
  { text: "Automate", pos: "is-center", start: 0.29, end: 0.49, fade: 0.07 },
  { text: "Scale", pos: "is-br", start: 0.53, end: 0.72, fade: 0.07 },
];

// Frames finish scrubbing here, then hold the bright final frame as the backdrop
// for the IPANGRAM.AI reveal.
const SCRUB_END = 0.78;
// IPANGRAM.AI fades in over [FINAL_START, FINAL_START+FINAL_FADE] -> full ~0.86,
// then holds at full strength until the layer fades out.
const FINAL_START = 0.73;
const FINAL_FADE = 0.13;
// Only after IPANGRAM.AI has held does the whole layer cross-fade out (0.93 -> 1)
// revealing the hero — so we never scroll toward the hero mid-word.
const LAYER_FADE_START = 0.93;

export default function IntroSequence() {
  // Skip only in headless / no-WebGL (static fallback) contexts. The intro is
  // scroll-driven so it's shown even under prefers-reduced-motion; we just drop
  // the non-essential text parallax there.
  const skip = useSceneStore((s) => !s.webglEnabled);
  const reduced = useSceneStore((s) => s.reducedMotion);
  const sequenceRef = useRef(null);
  const canvasRef = useRef(null);
  const wordRefs = useRef([]);
  const finalRef = useRef(null);
  const cueRef = useRef(null);

  useEffect(() => {
    if (skip) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    const images = new Array(FRAME_COUNT);

    // Frame the source image with object-fit: cover math, then draw it.
    const drawFrame = (idx) => {
      const img = images[idx];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw, dh, dx, dy;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    // Size the canvas to the viewport * devicePixelRatio for crisp full-bleed.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      drawFrame(Math.round(rendered));
    };

    // Preload frames. Draw the first as soon as it decodes; the rest stream in.
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      if (i === 0) {
        img.onload = () => drawFrame(0);
      }
      images[i] = img;
    }

    let rendered = 0; // currently shown frame (float, eased)
    let raf = null;

    const tick = () => {
      const p = useSceneStore.getState().introProgress;

      // Cross-fade the whole layer out only once IPANGRAM.AI has held, then hide
      // it entirely so it never blocks the hero below.
      if (sequenceRef.current) {
        const lo =
          p < LAYER_FADE_START
            ? 1
            : Math.max(0, 1 - (p - LAYER_FADE_START) / (1 - LAYER_FADE_START));
        sequenceRef.current.style.opacity = lo;
        sequenceRef.current.style.visibility = p >= 1 ? "hidden" : "visible";
      }

      // Frames scrub over [0, SCRUB_END]; then hold the final (brightest) frame.
      const target = Math.min(1, p / SCRUB_END) * (FRAME_COUNT - 1);

      // Once the intro is fully handed off (p≈1) and the eased frame has settled,
      // skip the canvas/text work so we don't burn GPU during the 3D journey.
      // We resume the moment the user scrolls back up.
      if (p >= 0.999 && Math.abs(target - rendered) < 0.01) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Ease the rendered frame toward the target — this is what makes it buttery.
      rendered += (target - rendered) * 0.16;
      if (Math.abs(target - rendered) < 0.01) rendered = target;
      const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(rendered)));
      drawFrame(idx);

      // Scroll hint over the opening black frames — fades out as soon as the user
      // starts scrolling.
      if (cueRef.current) {
        cueRef.current.style.opacity = Math.max(0, 1 - p / 0.05);
      }

      // Drive the text beats from the same progress (no React re-render per frame).
      // Centered beats keep their -50%/-50% centring baked into the transform so
      // the inline transform doesn't override the CSS one.
      for (let i = 0; i < BEATS.length; i++) {
        const el = wordRefs.current[i];
        if (!el) continue;
        const b = BEATS[i];
        const o = fadeWindow(p, b.start, b.end, b.fade);
        const rise = reduced ? 0 : (1 - o) * 26; // subtle parallax lift as it fades
        const base = b.pos === "is-center" ? "translate(-50%, -50%) " : "";
        el.style.opacity = o;
        el.style.transform = `${base}translate3d(0, ${rise}px, 0)`;
      }
      if (finalRef.current) {
        const o = fadeInHold(p, FINAL_START, FINAL_FADE);
        const ry = reduced ? 0 : (1 - o) * 20;
        const sc = reduced ? 1 : 0.96 + o * 0.04;
        finalRef.current.style.opacity = o;
        finalRef.current.style.transform = `translate(-50%, -50%) translate3d(0, ${ry}px, 0) scale(${sc})`;
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [skip, reduced]);

  // Headless / no-WebGL contexts: render nothing and add no scroll height, so the
  // page opens directly at the hero (introDone is already true in the store).
  if (skip) return null;

  return (
    <div className="intro-spacer" style={{ height: `${INTRO_VH * 100}vh` }} aria-hidden="true">
      <div ref={sequenceRef} className="intro-sequence" data-testid="intro-sequence">
        <canvas ref={canvasRef} className="intro-canvas" />
        <div className="intro-scrim" />

        {BEATS.map((b, i) => (
          <div
            key={b.text}
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            className={`intro-word ${b.pos}`}
            style={{ opacity: 0 }}
          >
            {b.text}
          </div>
        ))}

        <div ref={finalRef} className="intro-word intro-final is-center" style={{ opacity: 0 }}>
          IPANGRAM<span className="intro-accent">.AI</span>
        </div>

        <div ref={cueRef} className="intro-cue">
          <span>Scroll to begin</span>
          <span className="intro-cue-chevron" />
        </div>
      </div>
    </div>
  );
}
