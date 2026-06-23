import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useFocusFade } from "@/three/objects/_useFocusFade";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";
import { metal } from "@/three/materials";

function makeGearGeometry(radius, teeth, depth) {
  const shape = new THREE.Shape();
  const inner = radius * 0.62;
  const toothDepth = radius * 0.18;
  const segments = teeth * 2;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius - toothDepth;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner * 0.5, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, steps: 1 });
}

// Object 5 - Interlocking Gear Cluster. One gear is "stuck" until focus, then
// it snaps into smooth rotation as all gears sync. Detailed center hub + bolts.
export default function GearCluster({ index = 4, quality = "high" }) {
  const focus = useFocus(index);
  const [pulse, burst] = useClickPulse({ up: 0.12, down: 1.1 });
  const group = useRef();
  useFocusFade(group, focus);
  const centerRef = useRef();
  const satRefs = useRef([]);
  const stuckIndex = useMemo(() => Math.floor(Math.random() * 6), []);

  const centerGeo = useMemo(() => makeGearGeometry(1.0, 16, 0.18), []);
  const satGeo = useMemo(() => makeGearGeometry(0.5, 8, 0.16), []);

  const goldMat = useMemo(() => metal(C.gold, { quality, roughness: 0.36, metalness: 0.95, envMapIntensity: 1.35, emissive: C.gold }), [quality]);
  const tealMat = useMemo(() => metal(C.teal, { quality, roughness: 0.34, metalness: 0.9, envMapIntensity: 1.3, emissive: C.teal }), [quality]);

  const satellites = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dist = 1.45;
      arr.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist, dir: i % 2 === 0 ? 1 : -1 });
    }
    return arr;
  }, []);

  const bolts = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      arr.push({ x: Math.cos(a) * 0.26, y: Math.sin(a) * 0.26 });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const f = focus.current;
    const pv = pulse.current.v * (useSceneStore.getState().reducedMotion ? 0.35 : 1); // torque kick
    if (centerRef.current) centerRef.current.rotation.z += 0.3 * delta * (1 + pv * 12);
    satRefs.current.forEach((m, i) => {
      if (!m) return;
      const isStuck = i === stuckIndex;
      if (isStuck && f < 0.6 && pv < 0.05) {
        m.rotation.z += (Math.random() - 0.5) * 0.04;
      } else {
        // the kick spins every gear up (and frees the stuck one)
        m.rotation.z -= satellites[i].dir * (0.6 + pv * 9) * delta;
      }
      const die = m.children && m.children[0];
      if (die && die.material) {
        const targetE = isStuck ? (f > 0.6 ? 0.35 : 0) : f * 0.12;
        die.material.emissiveIntensity += (targetE + pv * 0.8 - die.material.emissiveIntensity) * 0.1;
      }
    });
  });

  return (
    <group
      ref={group}
      position={OBJECT_POSITIONS.gears}
      {...hoverProps("gears")}
      rotation={[0.1, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      {/* back plate for depth */}
      <mesh position={[0, 0, -0.2]}>
        <cylinderGeometry args={[2.3, 2.3, 0.06, 48]} />
        <meshStandardMaterial color="#CBD6E6" transparent opacity={0.6} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* center gear + hub assembly */}
      <group ref={centerRef}>
        <mesh geometry={centerGeo} castShadow>
          <meshPhysicalMaterial {...goldMat} emissiveIntensity={0} />
        </mesh>
        {/* hub cap */}
        <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.12, 24]} />
          <meshStandardMaterial color="#8A6A12" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* axle */}
        <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.14, 16]} />
          <meshStandardMaterial color={C.amber} roughness={0.35} metalness={0.6} />
        </mesh>
        {/* bolts */}
        {bolts.map((b, i) => (
          <mesh key={i} position={[b.x, b.y, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.08, 6]} />
            <meshStandardMaterial color="#5E4A0E" roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* satellite gears (group holds gear + hub for per-instance emissive) */}
      {satellites.map((s, i) => (
        <group key={i} position={[s.x, s.y, 0]} ref={(el) => (satRefs.current[i] = el)}>
          <mesh geometry={satGeo} castShadow>
            <meshPhysicalMaterial {...tealMat} emissiveIntensity={0} />
          </mesh>
          <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.1, 16]} />
            <meshStandardMaterial color="#0B6B5C" roughness={0.4} metalness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
