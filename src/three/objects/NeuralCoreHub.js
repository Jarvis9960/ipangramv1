import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useTransition } from "@/three/objects/_useTransition";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";
import { lacquer, metal } from "@/three/materials";

function fibonacciSphere(count, radius) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return pts;
}

// Object 1 - Neural Core Hub (Hero). Solid teal core, lit nodes, connector lines.
export default function NeuralCoreHub({ index = 0, quality = "high" }) {
  const group = useRef();
  const nodesRef = useRef();
  const ringParticlesRef = useRef();
  const coreRef = useRef();
  const focus = useFocus(index);
  const tr = useTransition(index);
  const [pulse, burst] = useClickPulse();

  const NODE_COUNT = quality === "low" ? 44 : 80;
  const RING_PARTICLES = quality === "low" ? 18 : 40;

  const nodePositions = useMemo(() => fibonacciSphere(NODE_COUNT, 1.4), [NODE_COUNT]);

  const edgeGeometry = useMemo(() => {
    const positions = [];
    const threshold = 0.85;
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < threshold) {
          positions.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
          positions.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [nodePositions]);

  const nodePhases = useMemo(() => nodePositions.map(() => Math.random() * Math.PI * 2), [nodePositions]);
  const rings = useMemo(
    () => [
      { tilt: THREE.MathUtils.degToRad(25), axis: "x" },
      { tilt: THREE.MathUtils.degToRad(65), axis: "z" },
      { tilt: THREE.MathUtils.degToRad(90), axis: "x" },
    ],
    []
  );
  const ringParticleData = useMemo(() => {
    const arr = [];
    for (let i = 0; i < RING_PARTICLES; i++) {
      arr.push({ ring: i % rings.length, angle: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 0.6, radius: 2.0 });
    }
    return arr;
  }, [RING_PARTICLES, rings.length]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const spin = useRef(0); // accumulated yaw so pointer-lean can own x/z
  const tilt = useRef({ x: 0, z: 0 });

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const f = focus.current;
    const store = useSceneStore.getState();
    const pv = pulse.current.v * (store.reducedMotion ? 0.35 : 1); // detonation 0..1

    const rotSpeed = THREE.MathUtils.lerp(0.0032, 0.0008, f);
    spin.current += rotSpeed * 60 * delta;

    // Cursor magnetism: the core leans toward the pointer, scaled by focus so it
    // only reacts while it's the hero in view. Eased for smoothness.
    const lean = store.reducedMotion ? 0 : f;
    const ptr = store.pointer;
    const tgtX = ptr.y * 0.28 * lean;
    const tgtZ = -ptr.x * 0.2 * lean;
    const k = Math.min(1, delta * 4);
    tilt.current.x += (tgtX - tilt.current.x) * k;
    tilt.current.z += (tgtZ - tilt.current.z) * k;
    g.rotation.set(tilt.current.x + rotSpeed * 0.33 * t, spin.current, tilt.current.z);

    // Hidden during the hero (beat 0): the hub only reveals + grows in as the
    // camera flies through the network toward it (beat 1). Folded into the
    // assemble-on-arrival scale so it appears to materialise from nothing.
    const reveal = THREE.MathUtils.smoothstep(store.scrollProgress, 0.02, 0.08);
    g.visible = reveal > 0.001;
    g.scale.setScalar(THREE.MathUtils.lerp(1.4, 1, tr.current) * reveal);
    if (!g.visible) return;

    if (nodesRef.current) {
      for (let i = 0; i < nodePositions.length; i++) {
        const np = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.5 + nodePhases[i]));
        dummy.position.copy(nodePositions[i]);
        if (pv > 0.0001) dummy.position.addScaledVector(nodePositions[i], pv * 0.7); // radial blast
        dummy.scale.setScalar(0.04 * (0.8 + np * 0.6) * (1 + pv * 0.8));
        dummy.updateMatrix();
        nodesRef.current.setMatrixAt(i, dummy.matrix);
        const amber = Math.sin(t * 0.7 + nodePhases[i] * 2.0) > 0.92;
        if (amber) tmpColor.set(C.amberDeep);
        else tmpColor.set(C.teal).multiplyScalar(0.6 + np * 0.4 + pv * 0.6);
        nodesRef.current.setColorAt(i, tmpColor);
      }
      nodesRef.current.instanceMatrix.needsUpdate = true;
      if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
    }

    if (ringParticlesRef.current) {
      for (let i = 0; i < ringParticleData.length; i++) {
        const d = ringParticleData[i];
        d.angle += d.speed * delta * (1 + pv * 5);
        const ring = rings[d.ring];
        const v = new THREE.Vector3(Math.cos(d.angle) * d.radius, Math.sin(d.angle) * d.radius, 0);
        if (ring.axis === "x") v.applyAxisAngle(new THREE.Vector3(1, 0, 0), ring.tilt);
        else v.applyAxisAngle(new THREE.Vector3(0, 0, 1), ring.tilt);
        dummy.position.copy(v);
        dummy.scale.setScalar(0.05);
        dummy.updateMatrix();
        ringParticlesRef.current.setMatrixAt(i, dummy.matrix);
      }
      ringParticlesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = f * 0.5 + pv * 2.0;
    }
  });

  const coreMat = useMemo(
    () => lacquer(C.teal, { quality, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.22, emissive: C.tealBright, envMapIntensity: 1.15 }),
    [quality]
  );
  const ringMat = useMemo(() => metal(C.teal, { quality, roughness: 0.28, envMapIntensity: 1.4 }), [quality]);

  return (
    <group
      ref={group}
      position={OBJECT_POSITIONS.neuralHub}
      {...hoverProps("neuralHub")}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      <mesh ref={coreRef} castShadow>
        <icosahedronGeometry args={[1.0, 3]} />
        <meshPhysicalMaterial {...coreMat} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.42, 2]} />
        <meshBasicMaterial color={C.teal} wireframe transparent opacity={0.12} />
      </mesh>
      <instancedMesh ref={nodesRef} args={[null, null, nodePositions.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.15} envMapIntensity={1.2} />
      </instancedMesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={C.line} transparent opacity={0.45} />
      </lineSegments>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={ring.axis === "x" ? [ring.tilt, 0, 0] : [0, 0, ring.tilt]}>
          <torusGeometry args={[2.0, 0.016, 12, 160]} />
          <meshPhysicalMaterial {...ringMat} />
        </mesh>
      ))}
      <instancedMesh ref={ringParticlesRef} args={[null, null, ringParticleData.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={C.amber} emissive={C.amber} emissiveIntensity={0.6} roughness={0.35} metalness={0.2} envMapIntensity={1.1} />
      </instancedMesh>
    </group>
  );
}
