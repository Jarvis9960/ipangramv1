import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useFocusFade } from "@/three/objects/_useFocusFade";
import { useSceneStore } from "@/store/useSceneStore";

const MODEL_URL = `${process.env.PUBLIC_URL}/models/robotic_arm.glb`;
useGLTF.preload(MODEL_URL, true);

const TARGET_SIZE = 3.5; // max dimension after normalisation — compact footprint
const BASE_ROT = [0, 0, 0]; // upright as authored; only a gentle sway on top

// Object 8 - Intelligent Systems. Animated robotic-arm GLB (Sketchfab export,
// already Y-up). Plays its bundled "Robotics" clip on loop — the articulation
// stays within the model's body, so no track surgery is needed. Keeps the
// gentle sway + focus lift + hover tooltip.
export default function BrainNetwork({ index = 8 }) {
  const group = useRef();
  const focus = useFocus(index);
  const { scene, animations } = useGLTF(MODEL_URL, true);
  // Bind the mixer to the actual gltf scene (where the animated nodes live)
  // rather than the outer wrapper group, so the bundled clip resolves + plays.
  const { actions, names } = useAnimations(animations, scene);

  // Fade in/out with focus so the model materialises as the camera approaches.
  useFocusFade(group, focus);

  // recentre to origin + scale to footprint (applied on a wrapper so the shared
  // gltf transform is never mutated). Disable frustum culling so the animated
  // meshes never mis-cull at the edges.
  const { scale, offset } = useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh) o.frustumCulled = false;
    });
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = TARGET_SIZE / maxDim;
    return { scale: s, offset: [-center.x * s, -center.y * s, -center.z * s] };
  }, [scene]);

  // play every bundled clip on loop (this model ships a single "Robotics" clip)
  useEffect(() => {
    names.forEach((n) => {
      const action = actions[n];
      if (action) action.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    });
    return () => names.forEach((n) => actions[n]?.stop());
  }, [actions, names]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const rm = useSceneStore.getState().reducedMotion ? 0.25 : 1;
    const f = focus.current;
    g.rotation.y = BASE_ROT[1] + Math.sin(t * 0.2) * 0.08 * rm;
    g.scale.setScalar(0.96 + f * 0.04);
  });

  return (
    <group ref={group} position={OBJECT_POSITIONS.brainNet} rotation={BASE_ROT} {...hoverProps("brainNet")}>
      <group position={offset} scale={scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
