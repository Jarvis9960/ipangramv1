import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useFocusFade } from "@/three/objects/_useFocusFade";
import { useSceneStore } from "@/store/useSceneStore";

const MODEL_URL = `${process.env.PUBLIC_URL}/models/chess.glb`;
useGLTF.preload(MODEL_URL);

const TARGET_SIZE = 5.5; // max dimension after normalisation
const BASE_TILT = 0.12; // slight downward tilt for a 3/4 board view

// Object 11 - Build a Smarter Business (final beat). Low-poly chess set: the
// strategy metaphor for the closing call to action. Plays its bundled clip on
// loop, with the shared gentle sway + focus lift + fade.
export default function ChessStrategy({ index = 11 }) {
  const focus = useFocus(index);
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, names } = useAnimations(animations, group);
  useFocusFade(group, focus);

  // recentre to origin + scale to footprint (applied on a wrapper so the shared
  // gltf transform is never mutated). Animated meshes can mis-cull, so disable
  // frustum culling.
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

  // play the single bundled clip on loop
  useEffect(() => {
    const action = actions[names[0]];
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    return () => action.stop();
  }, [actions, names]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const rm = useSceneStore.getState().reducedMotion ? 0.25 : 1;
    const f = focus.current;
    g.rotation.x = BASE_TILT;
    g.rotation.y = Math.sin(t * 0.2) * 0.25 * rm;
    g.scale.setScalar(0.96 + f * 0.04);
  });

  return (
    <group ref={group} position={OBJECT_POSITIONS.helix} {...hoverProps("helix")}>
      <group position={offset} scale={scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
