import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSceneStore } from "@/store/useSceneStore";
import { focusForIndex } from "@/config/checkpoints";

// Returns a ref whose .current smoothly tracks an "assembled" factor (0..1):
// 1 when the object is the framed checkpoint, easing to 0 as the camera flies
// away. Objects use it to assemble as they gain focus and disperse / fade as
// they lose it — which reads as a continuous morph along the narrative rail.
//
// Wider plateau than useFocus (so objects stay fully formed across more of the
// centre and only scatter near the extremes) plus a smoothstep for soft ends.
export function useTransition(index, { plateau = 1.6 } = {}) {
  const v = useRef(0);
  useFrame((_, delta) => {
    const p = useSceneStore.getState().scrollProgress;
    let target = Math.min(1, focusForIndex(p, index) * plateau);
    target = target * target * (3 - 2 * target); // smoothstep
    const k = Math.min(1, delta * 3);
    v.current += (target - v.current) * k;
  });
  return v;
}
