import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";
import { glassy, transmissionProps } from "@/three/materials";

const STRANDS = [
  { color: C.teal, phase: 0 },
  { color: C.amber, phase: (Math.PI * 2) / 3 },
  { color: C.blue, phase: (Math.PI * 4) / 3 },
];

// Object 11 - Triple Helix. Three intertwined strands rising and converging
// into a star, with particle streams flowing upward.
// Light theme: solid strand colors with soft shadows, no glow; focus adds only
// a very subtle accent.
export default function TripleHelix({ index = 10, quality = "high" }) {
  const focus = useFocus(index);
  const [pulse, burst] = useClickPulse({ up: 0.2, down: 1.1 });
  const groupRef = useRef();
  const strandRefs = useRef([]);
  const particleRefs = useRef([]);
  const starRef = useRef();

  const HEIGHT = 5;
  const TURNS = 3;
  const SEG = quality === "low" ? 60 : 110;
  const PARTICLES = quality === "low" ? 16 : 30;

  // Tube geometry for each strand following a helix that converges at top.
  const strandGeos = useMemo(() => {
    return STRANDS.map((s) => {
      const pts = [];
      for (let i = 0; i <= SEG; i++) {
        const u = i / SEG;
        const y = u * HEIGHT - HEIGHT / 2;
        const radius = 0.9 * (1 - u) + 0.02; // converge to top
        const a = u * Math.PI * 2 * TURNS + s.phase;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      return new THREE.TubeGeometry(curve, SEG, 0.04, 6, false);
    });
  }, [SEG]);

  const particleData = useMemo(
    () =>
      STRANDS.flatMap((s, si) =>
        Array.from({ length: PARTICLES }, () => ({ strand: si, t: Math.random(), speed: 0.15 + Math.random() * 0.2 }))
      ),
    [PARTICLES]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const strandMats = useMemo(
    () => STRANDS.map((s) => glassy(s.color, { quality, opacity: 0.86, roughness: 0.1, envMapIntensity: 1.5 })),
    [quality]
  );
  const starMat = useMemo(() => glassy(C.amber, { quality, opacity: 0.95, roughness: 0.08, emissiveIntensity: 0.15, envMapIntensity: 1.6 }), [quality]);

  // True refractive glass on high/mid (shared transmission pass); null -> glassy.
  const strandTrans = useMemo(
    () => STRANDS.map((s) => transmissionProps(s.color, { quality, thickness: 0.35, roughness: 0.08 })),
    [quality]
  );
  const starTrans = useMemo(
    () => transmissionProps(C.amber, { quality, thickness: 0.5, roughness: 0.06, ior: 1.5, chromaticAberration: 0.08 }),
    [quality]
  );

  function helixPoint(si, u) {
    const s = STRANDS[si];
    const y = u * HEIGHT - HEIGHT / 2;
    const radius = 0.9 * (1 - u) + 0.02;
    const a = u * Math.PI * 2 * TURNS + s.phase;
    return new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
  }

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const pv = pulse.current.v * (useSceneStore.getState().reducedMotion ? 0.35 : 1); // charge up
    if (groupRef.current) groupRef.current.rotation.y = t * (0.25 + pv * 1.5);
    strandRefs.current.forEach((m, i) => {
      if (m) m.material.emissiveIntensity = f * 0.25 + pv * 1.4;
    });
    if (particleRefs.current[0]) {
      const inst = particleRefs.current[0];
      for (let i = 0; i < particleData.length; i++) {
        const d = particleData[i];
        d.t += d.speed * delta * (1 + pv * 6); // streams surge upward on charge
        if (d.t > 1) d.t -= 1;
        const p = helixPoint(d.strand, d.t);
        dummy.position.copy(p);
        dummy.scale.setScalar(0.05 * (1 + pv * 0.8));
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
    if (starRef.current) {
      const s = 0.9 + Math.sin(t * 3) * 0.15 + f * 0.3 + pv * 1.2;
      starRef.current.scale.setScalar(s);
      if (starRef.current.material) starRef.current.material.emissiveIntensity = 0.15 + pv * 2.0;
    }
  });

  return (
    <group
      ref={groupRef}
      position={OBJECT_POSITIONS.helix}
      {...hoverProps("helix")}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      {strandGeos.map((geo, i) => (
        <mesh key={i} geometry={geo} ref={(el) => (strandRefs.current[i] = el)} castShadow>
          {strandTrans[i] ? (
            <MeshTransmissionMaterial {...strandTrans[i]} />
          ) : (
            <meshPhysicalMaterial {...strandMats[i]} emissiveIntensity={0} />
          )}
        </mesh>
      ))}
      <instancedMesh ref={(el) => (particleRefs.current[0] = el)} args={[null, null, particleData.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color={C.steel} roughness={0.5} metalness={0.1} />
      </instancedMesh>
      {/* converging star */}
      <mesh ref={starRef} position={[0, HEIGHT / 2 + 0.1, 0]} castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        {starTrans ? (
          <MeshTransmissionMaterial {...starTrans} />
        ) : (
          <meshPhysicalMaterial {...starMat} />
        )}
      </mesh>
    </group>
  );
}
