import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useSceneStore } from "@/store/useSceneStore";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useFocusFade } from "@/three/objects/_useFocusFade";

const MODEL_URL = `${process.env.PUBLIC_URL}/models/industry.glb`;
useGLTF.preload(MODEL_URL, true);

const TARGET_SIZE = 6; // max dimension after normalisation — compact footprint
const BASE_ROT_Y = 0; // face-on (straight), only a gentle sway on top

// Object 9 - Industries. Future-city GLB (Draco-compressed) for the "industries
// we support" beat. Keeps the gentle sway + focus lift; the Industries panel
// tabs drive selection on the HTML side.
export default function IndustryCity({ index = 9 }) {
  const focus = useFocus(index);
  const groupRef = useRef();
  useFocusFade(groupRef, focus);
  const { scene } = useGLTF(MODEL_URL, true); // Draco-compressed

  // Clone + normalise (recentre to origin, scale to footprint). The GLB was
  // authored almost fully-metallic (metalness ~1), which renders dark under our
  // soft HDRI and hides the albedo colours — so drop metalness to let the
  // authored colours show, and make the emissive signs / LEDs actually glow.
  const model = useMemo(() => {
    const root = scene.clone(true);
    const fix = (m) => {
      if (!m) return m;
      const c = m.clone();
      c.metalness = Math.min(c.metalness ?? 0, 0.15);
      c.envMapIntensity = 1.1;
      if (c.emissive && c.emissive.r + c.emissive.g + c.emissive.b > 0.01) {
        c.emissiveIntensity = 1.6;
      }
      c.needsUpdate = true;
      return c;
    };
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = false;
      o.material = Array.isArray(o.material) ? o.material.map(fix) : fix(o.material);
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = TARGET_SIZE / maxDim;
    root.scale.setScalar(s);
    root.position.set(-center.x * s, -center.y * s, -center.z * s);
    return root;
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = groupRef.current;
    if (!g) return;
    const rm = useSceneStore.getState().reducedMotion ? 0.25 : 1;
    const f = focus.current;
    // gentle showcase sway + a small lift toward the viewer while in focus
    g.rotation.y = BASE_ROT_Y + Math.sin(t * 0.2) * 0.08 * rm;
    g.scale.setScalar(0.96 + f * 0.04);
  });

  return (
    <group ref={groupRef} position={OBJECT_POSITIONS.cityBlock} {...hoverProps("cityBlock")} rotation={[0.16, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}
