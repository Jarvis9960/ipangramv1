import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useSceneStore } from "@/store/useSceneStore";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useClickPulses } from "@/three/objects/_useClickPulse";
import { C, CATEGORY } from "@/config/theme";
import { lacquer, metal } from "@/three/materials";

const HEIGHTS = [2.0, 2.6, 3.2, 2.6, 2.0];

// Object 4 - Five Pillars Array (detailed). Each column: tiered stone base,
// fluted lacquered shaft with a glowing vertical seam + emissive energy core,
// multi-tier capital with a metal ring, and a faceted crystal cap in a slowly
// spinning halo. Rising motes drift up the array. Click a pillar to select it.
export default function FivePillars({ index = 3, quality = "high" }) {
  const focus = useFocus(index);
  const pillarsRef = useRef([]);
  const seamRefs = useRef([]);
  const coreRefs = useRef([]);
  const capRefs = useRef([]);
  const haloRefs = useRef([]);
  const motesRef = useRef();
  const [pulses, bounce] = useClickPulses(5);
  const setSelection = useSceneStore((s) => s.setSelection);

  const FLUTES = quality === "low" ? 0 : quality === "mid" ? 8 : 12;
  const MOTES = quality === "low" ? 0 : quality === "mid" ? 16 : 28;

  const pillars = useMemo(
    () =>
      CATEGORY.map((color, i) => ({
        color,
        height: HEIGHTS[i],
        x: (i - 2) * 1.25,
        z: -Math.abs(i - 2) * 0.35,
      })),
    []
  );

  const fluteAngles = useMemo(
    () => Array.from({ length: FLUTES }, (_, k) => (k / FLUTES) * Math.PI * 2),
    [FLUTES]
  );

  const motes = useMemo(
    () =>
      Array.from({ length: MOTES }, () => {
        const p = Math.floor(Math.random() * 5);
        return {
          p,
          t: Math.random(),
          speed: 0.12 + Math.random() * 0.22,
          angle: Math.random() * Math.PI * 2,
          radius: 0.45 + Math.random() * 0.4,
        };
      }),
    [MOTES]
  );

  const shaftMats = useMemo(
    () => CATEGORY.map((c) => lacquer(c, { quality, roughness: 0.3, clearcoat: 0.75, clearcoatRoughness: 0.22, emissive: c, envMapIntensity: 1.05 })),
    [quality]
  );
  const capMats = useMemo(() => CATEGORY.map((c) => metal(c, { quality, roughness: 0.24, envMapIntensity: 1.3 })), [quality]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const moteColor = useMemo(() => new THREE.Color(C.teal), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const sel = useSceneStore.getState().selection.pillar;
    const rm = useSceneStore.getState().reducedMotion ? 0.35 : 1;

    pillarsRef.current.forEach((m, i) => {
      if (!m) return;
      const pv = pulses.current[i].v * rm;
      m.scale.y = 1 + Math.sin(t * 1.4 - Math.abs(i - 2) * 0.6) * 0.03 + pv * 0.5;
      m.scale.x = m.scale.z = 1 - pv * 0.14;
      const selected = sel === i;
      const targetE = (selected ? 0.42 : 0.04) + f * 0.12;
      m.material.emissiveIntensity += (targetE + pv * 0.7 - m.material.emissiveIntensity) * 0.12;
      // glowing seam + inner core pulse with selection / focus
      const glow = (selected ? 1 : 0.25) * (0.5 + f * 0.5) * (0.6 + 0.4 * Math.sin(t * 2.4 + i)) + pv * 1.5;
      const seam = seamRefs.current[i];
      if (seam) seam.material.emissiveIntensity = 0.4 + glow * 1.6;
      const core = coreRefs.current[i];
      if (core) core.material.emissiveIntensity = 0.3 + glow * 1.2;
    });

    capRefs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.y += delta * 0.6;
      m.position.y = pillars[i].height / 2 + 0.62 + Math.sin(t * 1.2 + i) * 0.07;
    });
    haloRefs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z += delta * 0.4;
      m.rotation.x = Math.sin(t * 0.6 + i) * 0.3;
    });

    if (motesRef.current && MOTES) {
      for (let k = 0; k < motes.length; k++) {
        const mo = motes[k];
        mo.t += delta * mo.speed;
        if (mo.t > 1) mo.t -= 1;
        const pl = pillars[mo.p];
        const a = mo.angle + t * 0.3;
        dummy.position.set(
          pl.x + Math.cos(a) * mo.radius,
          -0.3 + mo.t * (pl.height + 1.0),
          pl.z + Math.sin(a) * mo.radius
        );
        const s = 0.03 * (1 - Math.abs(mo.t - 0.5));
        dummy.scale.setScalar(Math.max(0.008, s));
        dummy.updateMatrix();
        motesRef.current.setMatrixAt(k, dummy.matrix);
      }
      motesRef.current.instanceMatrix.needsUpdate = true;
      motesRef.current.material.opacity = 0.35 + f * 0.4;
    }
  });

  return (
    <group position={OBJECT_POSITIONS.pillars} {...hoverProps("pillars")}>
      {/* platform base */}
      <mesh position={[0, -0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[8, 0.34, 2.5]} />
        <meshStandardMaterial color="#B7C3D6" roughness={0.72} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[7.6, 0.06, 2.05]} />
        <meshStandardMaterial color="#C7D2E2" roughness={0.5} metalness={0.25} />
      </mesh>
      {[-2.5, -1.25, 0, 1.25, 2.5].map((x, i) => (
        <mesh key={i} position={[x, -0.16, 0]}>
          <boxGeometry args={[0.05, 0.02, 1.95]} />
          <meshStandardMaterial color={C.teal} emissive={C.teal} emissiveIntensity={0.25} roughness={0.4} metalness={0.4} />
        </mesh>
      ))}

      {pillars.map((p, i) => (
        <group key={i} position={[p.x, p.height / 2, p.z]}>
          {/* tiered base mouldings */}
          <mesh position={[0, -p.height / 2 - 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.52, 0.58, 0.12, 24]} />
            <meshStandardMaterial color="#AEBCD2" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[0, -p.height / 2 + 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.44, 0.5, 0.1, 24]} />
            <meshStandardMaterial color="#C2CDDD" roughness={0.5} metalness={0.25} />
          </mesh>
          {/* emissive base glow ring */}
          <mesh position={[0, -p.height / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.46, 0.02, 8, 32]} />
            <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} roughness={0.4} metalness={0.4} />
          </mesh>

          {/* inner energy core (glows through the flutes/seam) */}
          <mesh ref={(el) => (coreRefs.current[i] = el)} position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.22, p.height * 0.96, 16]} />
            <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.3} roughness={0.5} metalness={0.2} />
          </mesh>

          {/* shaft (animated) */}
          <mesh
            ref={(el) => (pillarsRef.current[i] = el)}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              setSelection("pillar", i);
              bounce(i);
            }}
            {...hoverProps("pillars")}
          >
            <cylinderGeometry args={[0.32, 0.36, p.height, 28]} />
            <meshPhysicalMaterial {...shaftMats[i]} emissiveIntensity={0} />
          </mesh>

          {/* fluted ribs around the shaft */}
          {fluteAngles.map((ang, k) => (
            <mesh key={k} position={[Math.cos(ang) * 0.33, 0, Math.sin(ang) * 0.33]} rotation={[0, -ang, 0]} castShadow>
              <boxGeometry args={[0.05, p.height * 0.92, 0.05]} />
              <meshStandardMaterial color={p.color} roughness={0.35} metalness={0.45} />
            </mesh>
          ))}

          {/* glowing vertical seam on the front face */}
          <mesh ref={(el) => (seamRefs.current[i] = el)} position={[0, 0, 0.37]}>
            <boxGeometry args={[0.05, p.height * 0.8, 0.02]} />
            <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} roughness={0.3} metalness={0.3} />
          </mesh>

          {/* metal ring band near top */}
          <mesh position={[0, p.height / 2 - 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.05, 12, 32]} />
            <meshPhysicalMaterial {...capMats[i]} />
          </mesh>

          {/* multi-tier capital */}
          <mesh position={[0, p.height / 2 + 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.44, 0.38, 0.12, 24]} />
            <meshStandardMaterial color={p.color} roughness={0.3} metalness={0.45} />
          </mesh>
          <mesh position={[0, p.height / 2 + 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.42, 0.1, 24]} />
            <meshStandardMaterial color="#C7D2E2" roughness={0.4} metalness={0.35} />
          </mesh>

          {/* faceted crystal cap in a spinning halo */}
          <mesh ref={(el) => (capRefs.current[i] = el)} position={[0, p.height / 2 + 0.62, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshPhysicalMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} roughness={0.18} metalness={0.3} clearcoat={1} clearcoatRoughness={0.15} />
          </mesh>
          <mesh ref={(el) => (haloRefs.current[i] = el)} position={[0, p.height / 2 + 0.62, 0]}>
            <torusGeometry args={[0.34, 0.012, 8, 40]} />
            <meshBasicMaterial color={p.color} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* rising energy motes across the array */}
      {MOTES > 0 && (
        <instancedMesh ref={motesRef} args={[null, null, MOTES]}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial color={moteColor} emissive={C.teal} emissiveIntensity={0.8} transparent opacity={0.5} roughness={0.4} />
        </instancedMesh>
      )}
    </group>
  );
}
