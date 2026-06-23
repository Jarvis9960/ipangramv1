import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useFocusFade } from "@/three/objects/_useFocusFade";
import { useSceneStore } from "@/store/useSceneStore";

const MODEL_URL = `${process.env.PUBLIC_URL}/models/robot_playground.glb`;
useGLTF.preload(MODEL_URL);

const TARGET_SIZE = 5.0; // max dimension after normalisation
const SHIFT = [-1.4, 0, 0]; // nudge left so the robot clears the right-side panel

// Object 6 - Build · Automate · Scale. Animated robot (skinned GLB, "Experiment"
// clip) standing in for the framework beat. Keeps the gentle sway + focus lift +
// hover tooltip; the framework panel carries the Build/Automate/Scale copy.
export default function DigitalAvatar({ index = 6 }) {
  const focus = useFocus(index);
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, names } = useAnimations(animations, group);
  useFocusFade(group, focus);

  // recentre to origin + scale to footprint (skinned meshes never frustum-cull
  // reliably, so disable culling so the robot can't pop out mid-animation).
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
    g.rotation.y = Math.sin(t * 0.25) * 0.12 * rm;
    g.scale.setScalar(0.96 + f * 0.04);
  });

  return (
    <group
      ref={group}
      position={[OBJECT_POSITIONS.avatar[0] + SHIFT[0], OBJECT_POSITIONS.avatar[1] + SHIFT[1], OBJECT_POSITIONS.avatar[2] + SHIFT[2]]}
      {...hoverProps("avatar")}
    >
      <group position={offset} scale={scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
