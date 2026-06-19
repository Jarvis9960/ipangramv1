import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useSceneStore } from "@/store/useSceneStore";
import { CHECKPOINTS, OBJECT_POSITIONS } from "@/config/checkpoints";

// A teal point light that follows the currently focused object.
export default function FocusLight() {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current) return;
    const idx = useSceneStore.getState().activeIndex;
    const cp = CHECKPOINTS[idx];
    const pos = OBJECT_POSITIONS[cp.object] || [0, 0, 0];
    easing.damp3(ref.current.position, [pos[0], pos[1] + 1.5, pos[2] + 4], 0.5, delta);
    if (ref.current.color) ref.current.color.set(cp.accent || "#00D4AA");
  });
  return <pointLight ref={ref} intensity={2.2} distance={45} decay={1.4} color="#00D4AA" />;
}
