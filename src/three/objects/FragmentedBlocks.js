import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useFocusFade } from "@/three/objects/_useFocusFade";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { C } from "@/config/theme";
import { getDetailMaps } from "@/three/materials";

// Object 3 - Fragmented vs Connected Blocks. As the object gains focus the
// scattered, multi-coloured blocks assemble into a unified teal grid.
export default function FragmentedBlocks({ index = 2, quality = "high" }) {
  const focus = useFocus(index);
  const group = useRef();
  const refs = useRef([]);
  useFocusFade(group, focus);
  const dimColors = useMemo(() => [C.amberDeep, C.purple, C.blue, C.green], []);
  const teal = useMemo(() => new THREE.Color(C.teal), []);
  // Click-to-explode: pulse drives 0->1->0; useFrame reads .v to push blocks out.
  const [explode, burst] = useClickPulse({ up: 0.4, hold: 0.35, down: 0.9 });

  const blocks = useMemo(() => {
    const grid = [
      [-1.1, -0.6, 0], [0, -0.6, 0], [1.1, -0.6, 0],
      [-1.1, 0.6, 0], [0, 0.6, 0], [1.1, 0.6, 0],
      [-0.55, 0, 0.6], [0.55, 0, 0.6], [-0.55, 0, -0.6], [0.55, 0, -0.6],
    ];
    const arr = [];
    for (let i = 0; i < 10; i++) {
      const formation = new THREE.Vector3(grid[i][0], grid[i][1], grid[i][2]);
      const dir = formation.clone();
      if (dir.lengthSq() < 1e-4) dir.set(0, 1, 0); // centre block bursts upward
      dir.normalize();
      arr.push({
        formation,
        dir,
        scattered: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 3.4),
        rot: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6),
        size: 0.6 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        color: new THREE.Color(dimColors[i % dimColors.length]),
      });
    }
    return arr;
  }, [dimColors]);

  // Clearcoat + shared micro-detail so the blocks read as solid lacquered units
  // rather than flat plastic. Color/emissive are still animated per-frame.
  const blockExtra = useMemo(() => {
    if (quality === "low") return { clearcoat: 0, envMapIntensity: 1 };
    const { normalMap, roughnessMap } = getDetailMaps();
    return { clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 1.05, normalMap, normalScale: [0.22, 0.22], roughnessMap };
  }, [quality]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const ex = explode.current.v;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const b = blocks[i];
      const drift = new THREE.Vector3(
        Math.sin(t * 0.6 + b.phase) * 0.25,
        Math.cos(t * 0.5 + b.phase) * 0.25,
        Math.sin(t * 0.4 + b.phase) * 0.2
      );
      const sc = b.scattered.clone().add(drift);
      m.position.lerpVectors(sc, b.formation, f);
      m.rotation.x = b.rot.x * (1 - f) + ex * 2.4;
      m.rotation.y = b.rot.y * (1 - f) + ex * 2.4;
      m.rotation.z = b.rot.z * (1 - f);
      if (ex > 0.0001) {
        // blow blocks radially outward from the cluster centre, then snap back
        m.position.addScaledVector(b.dir, ex * 2.6);
      }
      m.scale.setScalar(THREE.MathUtils.lerp(b.size, 0.66, f));
      m.material.color.lerpColors(b.color, teal, f);
      m.material.emissive.lerpColors(b.color, teal, f);
      m.material.emissiveIntensity = f * 0.18;
    });
  });

  return (
    <group ref={group} position={OBJECT_POSITIONS.blocks} {...hoverProps("blocks")}>
      {blocks.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          castShadow
          onClick={(e) => {
            e.stopPropagation();
            burst();
          }}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color={b.color} emissive={b.color} emissiveIntensity={0} roughness={0.42} metalness={0.2} {...blockExtra} />
        </mesh>
      ))}
    </group>
  );
}
