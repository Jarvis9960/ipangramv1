import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Fades a whole object in/out with its focus factor so it materialises as the
// camera approaches its checkpoint and is invisible at the neighbouring beats —
// instead of lingering as a hard, aliased sliver in the background.
//
// Pass the object's ROOT group ref (the one carrying its world position) and its
// useFocus ref. Materials are collected lazily on the first populated frame and
// each one's authored opacity is preserved (once) as the fade ceiling, so a
// re-mount on scroll re-entry can never "bake in" a faded value.
//
// Only safe for objects that do NOT animate material.opacity themselves; those
// (HeroNetwork, NeuralCoreHub, WaveformOrb, BrainNetwork) fold the fade into
// their own opacity formulas instead.
export function useFocusFade(groupRef, focus, { lo = 0.04, hi = 0.8 } = {}) {
  const mats = useRef(null);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    if (!mats.current) {
      const found = [];
      g.traverse((o) => {
        const m = o.material;
        if (!m) return;
        for (const mm of Array.isArray(m) ? m : [m]) {
          // Capture the authored opacity once — survives unmount/remount on
          // shared (cached GLB) materials so the ceiling never drifts.
          if (mm.userData.baseOpacity == null) mm.userData.baseOpacity = mm.opacity;
          mm.transparent = true;
          found.push(mm);
        }
      });
      mats.current = found;
    }

    const fade = THREE.MathUtils.smoothstep(focus.current, lo, hi);
    g.visible = fade > 0.001;
    for (const m of mats.current) m.opacity = m.userData.baseOpacity * fade;
  });
}
