import { useRef } from "react";
import { gsap } from "gsap";

// Click "signature move" driver. Returns [pulse, trigger]:
//   pulse.current.v ramps 0 -> 1 (attack) -> 0 (release) on trigger()
//   read pulse.current.v inside a useFrame loop to drive the gesture.
// killTweensOf on each trigger so rapid clicks restart cleanly instead of
// stacking. Amplitude scaling for reduced-motion is left to the caller.
export function useClickPulse({ up = 0.28, hold = 0.05, down = 0.7, ease = "power3.out" } = {}) {
  const pulse = useRef({ v: 0 });
  const trigger = () => {
    gsap.killTweensOf(pulse.current);
    pulse.current.v = 0;
    gsap.to(pulse.current, { v: 1, duration: up, ease });
    gsap.to(pulse.current, { v: 0, duration: down, ease: "power2.inOut", delay: up + hold });
  };
  return [pulse, trigger];
}

// Per-child variant: N independent pulses + trigger(i). Used by objects whose
// individual elements are clickable (pillars, city buildings). Uses an elastic
// release by default so a single element springs.
export function useClickPulses(count, { up = 0.22, ease = "power3.out", releaseEase = "elastic.out(1,0.45)", down = 0.9 } = {}) {
  const pulses = useRef(Array.from({ length: count }, () => ({ v: 0 })));
  const trigger = (i) => {
    const p = pulses.current[i];
    if (!p) return;
    gsap.killTweensOf(p);
    p.v = 0;
    gsap.to(p, { v: 1, duration: up, ease });
    gsap.to(p, { v: 0, duration: down, ease: releaseEase, delay: up });
  };
  return [pulses, trigger];
}
