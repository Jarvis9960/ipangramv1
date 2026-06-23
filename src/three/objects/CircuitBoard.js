import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useFocusFade } from "@/three/objects/_useFocusFade";
import { useSceneStore } from "@/store/useSceneStore";

const MODEL_URL = `${process.env.PUBLIC_URL}/models/whiteboard_short_circuit_line_graph.glb`;
useGLTF.preload(MODEL_URL, true);

const TARGET_SIZE = 4.5; // max dimension after normalisation — compact footprint
// The whiteboard is a Sketchfab export (already Y-up via its own node
// hierarchy), so it stands upright as authored. A slight downward tilt + a
// positive Y yaw turn the drawn face toward the right (toward the text panel).
const BASE_ROT = [-0.12, 0.5, 0];

// Object 2 - Whiteboard Line Graph. Static GLB (ships no clip), so it relies on
// the gentle sway + focus lift + hover tooltip. The clip-playing code below is a
// no-op when the model carries no animations.
export default function CircuitBoard({ index = 2 }) {
  const group = useRef();
  const focus = useFocus(index);
  const { scene, animations } = useGLTF(MODEL_URL, true);
  // The bundled clip rotates the circuit nicely but also translates it across a
  // huge ±18u range, flinging it off-screen and making the apparent size pulse.
  // Strip the position tracks so it spins in place at a stable size.
  const clips = useMemo(
    () =>
      animations.map((clip) => {
        const c = clip.clone();
        c.tracks = c.tracks.filter((t) => !/\.position$/.test(t.name));
        return c;
      }),
    [animations]
  );
  // Bind the mixer to the actual gltf scene (where the animated nodes live)
  // rather than the outer wrapper group, so the clip resolves + plays.
  const { actions, names } = useAnimations(clips, scene);

  // Fade in/out with focus so the board materialises as the camera approaches
  // instead of sitting as a hard, aliased sliver behind the brain at beat 1.
  useFocusFade(group, focus);

  // recentre to origin + scale to footprint (applied on a wrapper so the shared
  // gltf transform is never mutated). Skinned/animated meshes can mis-cull, so
  // disable frustum culling.
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

  // play every bundled clip on loop (this model ships a single "Animation" clip)
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
    g.rotation.x = BASE_ROT[0] + Math.sin(t * 0.5) * 0.025 * rm;
    g.rotation.y = BASE_ROT[1] + Math.sin(t * 0.35) * 0.035 * rm;
    g.scale.setScalar(0.96 + f * 0.04);
  });

  return (
    <group ref={group} position={OBJECT_POSITIONS.circuit} rotation={BASE_ROT} {...hoverProps("circuit")}>
      <group position={offset} scale={scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
