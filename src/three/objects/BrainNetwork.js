import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useTransition } from "@/three/objects/_useTransition";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";

// Object 8 - Knowledge Brain Network (clean rebuild). Two bright hemispherical
// lobes (teal / amber) of nodes wired by a dense lattice, wrapped in a faint
// brain-shell, with a soft inner core glow and synapse pulses flowing along the
// edges. Node colours are bright + set once so it reads as a crisp network on
// the grey ground (no dark/washed instances), not a black blob.
export default function BrainNetwork({ index = 8, quality = "high" }) {
  const focus = useFocus(index);
  const tr = useTransition(index);
  const [ping, burst] = useClickPulse({ up: 0.16, down: 1.0 });
  const groupRef = useRef();
  const leftRef = useRef();
  const rightRef = useRef();
  const synapseRef = useRef();
  const linesRef = useRef();
  const coreRef = useRef();

  const NODE_COUNT = quality === "low" ? 80 : quality === "mid" ? 120 : 150;

  const { leftNodes, rightNodes, edgeGeometry, edges } = useMemo(() => {
    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const side = i < NODE_COUNT / 2 ? -1 : 1;
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const rad = Math.cbrt(Math.random());
      // Brain-ish ellipsoid lobe, offset on x with a longitudinal fissure gap.
      const p = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * 1.05 * rad + side * 0.62,
        Math.cos(phi) * 0.92 * rad,
        Math.sin(phi) * Math.sin(theta) * 1.15 * rad
      );
      nodes.push({ p, side, phase: Math.random() * Math.PI * 2 });
    }
    const positions = [];
    const edges = [];
    const threshold = 0.6;
    for (let i = 0; i < nodes.length; i++) {
      let cnt = 0;
      for (let j = i + 1; j < nodes.length; j++) {
        if (cnt > 4) break;
        // links stay within a lobe mostly (skip if far across the fissure)
        if (nodes[i].p.distanceTo(nodes[j].p) < threshold) {
          positions.push(nodes[i].p.x, nodes[i].p.y, nodes[i].p.z, nodes[j].p.x, nodes[j].p.y, nodes[j].p.z);
          edges.push([nodes[i].p, nodes[j].p]);
          cnt++;
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const leftNodes = nodes.filter((n) => n.side < 0);
    const rightNodes = nodes.filter((n) => n.side > 0);
    return { nodes, leftNodes, rightNodes, edgeGeometry: geo, edges };
  }, [NODE_COUNT]);

  const SYN = quality === "low" ? 26 : quality === "mid" ? 44 : 64;
  const synapses = useMemo(
    () =>
      Array.from({ length: SYN }, () => ({
        edge: Math.floor(Math.random() * Math.max(1, edges.length)),
        t: Math.random(),
        speed: 0.5 + Math.random() * 1.3,
      })),
    [SYN, edges.length]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update one lobe's instanced matrices (twinkle scale) — no per-instance
  // colour needed because each lobe is a solid emissive material (robust + bright).
  const updateLobe = (ref, arr, t, pv, reduced) => {
    if (!ref.current) return;
    for (let i = 0; i < arr.length; i++) {
      const n = arr[i];
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + n.phase);
      const twinkle = reduced ? 1 : 0.8 + 0.35 * pulse;
      dummy.position.copy(n.p);
      dummy.scale.setScalar(0.052 * twinkle * (1 + pv * 0.7));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const a = tr.current; // 0 dispersed -> 1 formed
    const reduced = useSceneStore.getState().reducedMotion;
    const pv = ping.current.v * (reduced ? 0.35 : 1);

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
      if (!reduced) groupRef.current.rotation.y = Math.sin(t * 0.18) * 0.25;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(1.2, 1, a));
    }
    const nodeOpacity = 0.6 + a * 0.4;
    if (leftRef.current?.material) leftRef.current.material.opacity = nodeOpacity;
    if (rightRef.current?.material) rightRef.current.material.opacity = nodeOpacity;
    if (linesRef.current?.material) linesRef.current.material.opacity = a * (0.28 + f * 0.22);
    if (coreRef.current) {
      coreRef.current.material.opacity = (0.1 + f * 0.18 + pv * 0.3) * a;
      coreRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04 + pv * 0.3);
    }

    updateLobe(leftRef, leftNodes, t, pv, reduced);
    updateLobe(rightRef, rightNodes, t, pv, reduced);

    if (synapseRef.current && edges.length) {
      for (let i = 0; i < synapses.length; i++) {
        const s = synapses[i];
        if (!reduced) s.t += s.speed * delta * 0.6;
        if (s.t > 1) {
          s.t = 0;
          s.edge = Math.floor(Math.random() * edges.length);
        }
        const e = edges[s.edge];
        const p = e[0].clone().lerp(e[1], s.t);
        dummy.position.copy(p);
        dummy.scale.setScalar(0.05 * (1 + pv * 1.2));
        dummy.updateMatrix();
        synapseRef.current.setMatrixAt(i, dummy.matrix);
      }
      synapseRef.current.instanceMatrix.needsUpdate = true;
      synapseRef.current.material.opacity = a;
      synapseRef.current.material.emissiveIntensity = 0.6 + f * 0.6 + pv * 1.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={OBJECT_POSITIONS.brainNet}
      {...hoverProps("brainNet")}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      {/* bright node lobes — teal (left) + amber (right), emissive so they read
          clearly on the grey ground (no black/washed instances) */}
      <instancedMesh ref={leftRef} args={[null, null, leftNodes.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={C.tealBright} emissive={C.tealBright} emissiveIntensity={0.55} transparent opacity={1} roughness={0.3} metalness={0.1} envMapIntensity={1.1} />
      </instancedMesh>
      <instancedMesh ref={rightRef} args={[null, null, rightNodes.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={C.amber} emissive={C.amber} emissiveIntensity={0.5} transparent opacity={1} roughness={0.3} metalness={0.1} envMapIntensity={1.1} />
      </instancedMesh>

      {/* connection lattice */}
      <lineSegments ref={linesRef} geometry={edgeGeometry}>
        <lineBasicMaterial color={C.teal} transparent opacity={0.3} />
      </lineSegments>

      {/* flowing synapse pulses */}
      <instancedMesh ref={synapseRef} args={[null, null, synapses.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={C.tealBright} emissive={C.tealBright} emissiveIntensity={0.6} transparent opacity={1} roughness={0.3} metalness={0.2} />
      </instancedMesh>

      {/* soft inner core glow */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.85, 24, 24]} />
        <meshBasicMaterial color={C.teal} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {/* faint brain shell + longitudinal fissure seam */}
      <mesh>
        <sphereGeometry args={[1.85, 24, 18]} />
        <meshBasicMaterial color={C.line} wireframe transparent opacity={0.08} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.02, 2.0]} />
        <meshBasicMaterial color={C.teal} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
