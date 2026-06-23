import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSceneStore } from "@/store/useSceneStore";
import { progressToIndex, indexToProgress } from "@/config/checkpoints";
import { introHeightPx } from "@/config/intro";

gsap.registerPlugin(ScrollTrigger);

// Smooth scrolling via Lenis for capable browsers, PLUS a native scroll listener
// and instant jump handling so the active section / panel updates reliably even
// when rAF/timers are throttled (headless / low-power / background tabs).
export function useLenisScroll() {
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);
  const setActiveIndex = useSceneStore((s) => s.setActiveIndex);
  const setScrollVelocity = useSceneStore((s) => s.setScrollVelocity);
  const setIntroProgress = useSceneStore((s) => s.setIntroProgress);
  const setIntroDone = useSceneStore((s) => s.setIntroDone);

  useEffect(() => {
    // Always start at the very top so the cinematic intro plays from frame 0.
    // This MUST happen before Lenis is created below: on refresh the browser
    // restores the previous scroll position, and if Lenis initializes while
    // scrolled into the hero it adopts that position as its target and yanks the
    // page straight back there — skipping the intro entirely. Disabling native
    // scroll restoration + resetting to 0 first means Lenis is born at the top.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const reduced = useSceneStore.getState().reducedMotion;
    // The intro is only skipped in headless / no-WebGL contexts (component renders
    // no spacer there), so its band has zero height and the journey starts at 0.
    const skipIntro = !useSceneStore.getState().webglEnabled;
    const getIntroH = () => (skipIntro ? 0 : introHeightPx());
    const webgl = useSceneStore.getState().webglEnabled;
    let lenis = null;
    let lastIndex = -1;

    // --- Normalized scroll velocity (0..~1) for reactive 3D effects ---
    // Driven from the same update() path that both Lenis and the native scroll
    // listener call, so it works under reduced-motion too. A short rAF decay
    // loop eases it back to 0 once scrolling stops.
    let velocity = 0;
    let lastY = window.scrollY;
    let lastT = (typeof performance !== "undefined" ? performance.now() : Date.now());
    let decayRaf = null;

    const decay = () => {
      velocity *= 0.9;
      if (velocity < 0.001) {
        velocity = 0;
        setScrollVelocity(0);
        decayRaf = null;
        return;
      }
      setScrollVelocity(velocity);
      decayRaf = requestAnimationFrame(decay);
    };

    const getLimit = () => document.documentElement.scrollHeight - window.innerHeight;

    const update = () => {
      const limit = getLimit();
      const introH = getIntroH();

      // Intro band drives the frame-sequence scrub (0..1 over the first introH px).
      const ip = introH > 0 ? Math.min(1, Math.max(0, window.scrollY / introH)) : 1;
      setIntroProgress(ip);
      setIntroDone(window.scrollY >= introH);

      // Journey progress is offset so the existing 3D experience is unchanged once
      // past the intro: 0 at scrollY=introH, 1 at the bottom of the page.
      const journeyLimit = limit - introH;
      const p =
        journeyLimit > 0
          ? Math.min(1, Math.max(0, (window.scrollY - introH) / journeyLimit))
          : 0;
      setScrollProgress(p);
      const idx = progressToIndex(p);
      if (idx !== lastIndex) {
        lastIndex = idx;
        setActiveIndex(idx);
      }

      // px/ms -> clamped 0..1 (fast flick ~ 1). Attack fast, release via decay.
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const dt = Math.max(16, now - lastT);
      const inst = Math.min(1, (Math.abs(window.scrollY - lastY) / dt) / 3);
      lastY = window.scrollY;
      lastT = now;
      velocity = Math.max(velocity * 0.6, inst);
      setScrollVelocity(velocity);
      if (!decayRaf) decayRaf = requestAnimationFrame(decay);
    };

    // Native scroll listener — fires on real scroll regardless of rAF state.
    window.addEventListener("scroll", update, { passive: true });

    // Lenis smooth scroll (skip for reduced-motion / no-webgl static contexts).
    if (webgl && !reduced) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // Wheel is owned by useScrollSnap (one gesture = one section). Lenis stays
        // alive only to animate the programmatic scrollTo glide between sections.
        smoothWheel: false,
        syncTouch: false,
      });
      // Pin Lenis's internal target to the top too, so it can't glide back to a
      // restored scroll position on its first frame.
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.on("scroll", update);
      const raf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      useLenisScroll._raf = raf;
    }

    // Programmatic jumps (nav / dots / keyboard).
    const unsub = useSceneStore.subscribe((state, prev) => {
      if (state.jumpTarget !== null && state.jumpTarget !== prev.jumpTarget) {
        const target = state.jumpTarget;
        const limit = getLimit();
        const introH = getIntroH();
        const targetProgress = indexToProgress(target);
        // Map journey progress back into the offset document (skip the intro band).
        const y = introH + targetProgress * (limit - introH);
        // Instant panel switch (works even when rAF is frozen).
        setActiveIndex(target);
        setScrollProgress(targetProgress);
        lastIndex = target;
        if (lenis) {
          lenis.scrollTo(y, { duration: 1.2 });
        } else {
          // Instant jump for static/reduced/headless contexts so the active
          // section isn't reset by an unfinished smooth-scroll animation.
          window.scrollTo(0, y);
          setActiveIndex(target);
          setScrollProgress(targetProgress);
        }
        useSceneStore.getState().clearJump();
      }
    });

    update();

    return () => {
      window.removeEventListener("scroll", update);
      unsub();
      if (decayRaf) cancelAnimationFrame(decayRaf);
      if (lenis) {
        if (useLenisScroll._raf) gsap.ticker.remove(useLenisScroll._raf);
        lenis.destroy();
      }
    };
  }, [setScrollProgress, setActiveIndex, setScrollVelocity, setIntroProgress, setIntroDone]);
}
