import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";
import { lacquer } from "@/three/materials";

// Board is modelled in its local XY plane with the detailed (component) face
// pointing toward +z. The group is then rotated so that face turns to meet the
// camera at the circuit checkpoint.
const RX = -0.24; // pitch so the top tilts toward the (slightly elevated) camera
const RY = 0.5; // yaw so the face turns toward the camera's x-offset
const FZ = 0.11; // front face z (half board thickness)

// PCB palette tuned for the light theme.
const PCB = "#15564B"; // deep teal substrate
const PCB_RIM = "#1C6E60";
const COPPER = C.gold; // trace / pad copper
const DULL = "#7C8AA3"; // inactive (left half) components
const CHIP_BODY = "#243244";
const CHIP_DIE = "#46566E";

// Small surface-mount IC with two gold leg strips. `active` chips (right half)
// get a teal die that pulses with focus.
function Chip({ x, y, w, h, active, dieRef }) {
  return (
    <group position={[x, y, FZ]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color={CHIP_BODY} roughness={0.5} metalness={0.45} />
      </mesh>
      {/* die / marking */}
      <mesh position={[0, 0, 0.08]} ref={dieRef}>
        <boxGeometry args={[w * 0.62, h * 0.62, 0.03]} />
        <meshStandardMaterial
          color={active ? C.teal : CHIP_DIE}
          emissive={active ? C.teal : "#000000"}
          emissiveIntensity={0}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* leg strips */}
      <mesh position={[-w / 2 - 0.03, 0, -0.02]}>
        <boxGeometry args={[0.08, h * 0.9, 0.04]} />
        <meshStandardMaterial color={COPPER} roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[w / 2 + 0.03, 0, -0.02]}>
        <boxGeometry args={[0.08, h * 0.9, 0.04]} />
        <meshStandardMaterial color={COPPER} roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  );
}

// Object 2 - Circuit Motherboard (detailed). Left half = dull, separate parts;
// right half = teal, connected parts with L->R signal pulses on focus.
export default function CircuitBoard({ index = 1, quality = "high" }) {
  const group = useRef();
  const focus = useFocus(index);
  const [pulse, burst] = useClickPulse();
  const rightDies = useRef([]);
  const cpuDie = useRef();
  const sigRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const rows = useMemo(() => [-1.45, -0.75, 0, 0.75, 1.45], []);

  // copper traces (left dull, right teal) per row
  const traces = useMemo(() => {
    const arr = [];
    rows.forEach((y) => {
      arr.push({ x: -1.55, y, len: 2.5, color: DULL, op: 0.85 });
      arr.push({ x: 1.55, y, len: 2.5, color: C.teal, op: 0.95 });
    });
    return arr;
  }, [rows]);

  // vertical feeder traces on the right half
  const feeders = useMemo(
    () => [
      { x: 0.35, y: 0, h: 3.0 },
      { x: 2.75, y: 0, h: 2.8 },
    ],
    []
  );

  const caps = useMemo(
    () => [
      { x: 2.45, y: 0.55, r: 0.13, h: 0.34, top: C.amber, dull: false },
      { x: 0.95, y: -1.55, r: 0.11, h: 0.3, top: C.teal, dull: false },
      { x: 2.55, y: -1.15, r: 0.12, h: 0.32, top: C.amber, dull: false },
      { x: -2.35, y: 0.7, r: 0.12, h: 0.3, top: DULL, dull: true },
      { x: -1.0, y: -1.55, r: 0.11, h: 0.28, top: DULL, dull: true },
    ],
    []
  );

  const resistors = useMemo(
    () => [
      { x: -0.6, y: 1.15 }, { x: -1.2, y: 0.4 }, { x: -2.0, y: -0.2 },
      { x: 1.1, y: 1.1 }, { x: 1.9, y: 0.35 }, { x: 0.8, y: -0.7 },
    ],
    []
  );

  const vias = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      arr.push({ x: (Math.random() - 0.5) * 5.4, y: (Math.random() - 0.5) * 3.4 });
    }
    return arr;
  }, []);

  const headerPins = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 9; i++) arr.push(-0.8 + i * 0.2);
    return arr;
  }, []);

  // CPU pin rows (premium detail on the central processor)
  const cpuPins = useMemo(() => {
    const arr = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 0.16;
      arr.push({ side: "t", o });
      arr.push({ side: "b", o });
      arr.push({ side: "l", o });
      arr.push({ side: "r", o });
    }
    return arr;
  }, []);

  // ICs: left dull (separate), right active (connected)
  const leftChips = useMemo(
    () => [
      { x: -1.7, y: 1.15, w: 0.6, h: 0.42 },
      { x: -2.2, y: -0.45, w: 0.5, h: 0.5 },
      { x: -1.4, y: -1.25, w: 0.55, h: 0.4 },
    ],
    []
  );
  const rightChips = useMemo(
    () => [
      { x: 1.7, y: 1.2, w: 0.62, h: 0.42 },
      { x: 2.25, y: -0.4, w: 0.5, h: 0.5 },
      { x: 1.45, y: -1.3, w: 0.55, h: 0.42 },
    ],
    []
  );

  // Glossy solder-mask substrate (wet PCB look) with subtle surface detail.
  const pcbMat = useMemo(
    () => lacquer(PCB, { quality, roughness: 0.5, metalness: 0.2, clearcoat: 0.85, clearcoatRoughness: 0.32, envMapIntensity: 0.9, normal: 0.45 }),
    [quality]
  );

  const SIG = quality === "low" ? 6 : 12;
  const sig = useMemo(
    () =>
      Array.from({ length: SIG }, () => ({
        y: rows[Math.floor(Math.random() * rows.length)],
        t: Math.random(),
        speed: 0.25 + Math.random() * 0.4,
      })),
    [SIG, rows]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const pv = pulse.current.v * (useSceneStore.getState().reducedMotion ? 0.35 : 1); // power surge
    const g = group.current;
    if (g) {
      g.rotation.x = RX + Math.sin(t * 0.5) * 0.025;
      g.rotation.y = RY + Math.sin(t * 0.35) * 0.035;
    }
    rightDies.current.forEach((m, i) => {
      if (!m) return;
      m.material.emissiveIntensity = f * (0.12 + 0.32 * (0.5 + 0.5 * Math.sin(t * 3 - i * 0.7))) + pv * 1.2;
    });
    if (cpuDie.current) {
      cpuDie.current.material.emissiveIntensity = f * (0.18 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2))) + pv * 1.5;
    }
    if (sigRef.current) {
      for (let i = 0; i < SIG; i++) {
        const d = sig[i];
        d.t += delta * d.speed * (1 + pv * 6); // packets race on surge
        if (d.t > 1) d.t -= 1;
        const x = 0.1 + d.t * 2.75; // travel along the right half, L->R
        dummy.position.set(x, d.y, FZ + 0.04);
        dummy.scale.setScalar(0.055 * (1 + pv * 0.8));
        dummy.updateMatrix();
        sigRef.current.setMatrixAt(i, dummy.matrix);
      }
      sigRef.current.instanceMatrix.needsUpdate = true;
      sigRef.current.material.emissiveIntensity = 0.2 + f * 0.8 + pv * 1.5;
    }
  });

  return (
    <group
      ref={group}
      position={OBJECT_POSITIONS.circuit}
      rotation={[RX, RY, 0]}
      {...hoverProps("circuit")}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      {/* PCB substrate */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6, 4, 0.2]} />
        <meshPhysicalMaterial {...pcbMat} />
      </mesh>
      {/* raised rim */}
      {[
        { p: [0, 1.95, FZ - 0.05], s: [6, 0.12, 0.06] },
        { p: [0, -1.95, FZ - 0.05], s: [6, 0.12, 0.06] },
        { p: [-2.95, 0, FZ - 0.05], s: [0.12, 4, 0.06] },
        { p: [2.95, 0, FZ - 0.05], s: [0.12, 4, 0.06] },
      ].map((r, i) => (
        <mesh key={i} position={r.p}>
          <boxGeometry args={r.s} />
          <meshStandardMaterial color={PCB_RIM} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {/* center divider (dull -> active) */}
      <mesh position={[0, 0, FZ]}>
        <boxGeometry args={[0.05, 3.6, 0.02]} />
        <meshStandardMaterial color={C.amber} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* copper traces */}
      {traces.map((tr, i) => (
        <mesh key={`t${i}`} position={[tr.x, tr.y, FZ]}>
          <boxGeometry args={[tr.len, 0.05, 0.015]} />
          <meshStandardMaterial color={tr.color} transparent opacity={tr.op} roughness={0.4} metalness={0.55} />
        </mesh>
      ))}
      {feeders.map((fd, i) => (
        <mesh key={`f${i}`} position={[fd.x, fd.y, FZ]}>
          <boxGeometry args={[0.05, fd.h, 0.015]} />
          <meshStandardMaterial color={C.teal} transparent opacity={0.9} roughness={0.4} metalness={0.55} />
        </mesh>
      ))}

      {/* CPU */}
      <group position={[0.25, 0.15, FZ]}>
        <mesh castShadow>
          <boxGeometry args={[1.15, 1.15, 0.14]} />
          <meshStandardMaterial color="#1c2a3a" roughness={0.45} metalness={0.5} />
        </mesh>
        {/* heat spreader / die */}
        <mesh position={[0, 0, 0.09]} ref={cpuDie}>
          <boxGeometry args={[0.78, 0.78, 0.05]} />
          <meshStandardMaterial color={C.teal} emissive={C.teal} emissiveIntensity={0} roughness={0.35} metalness={0.4} />
        </mesh>
        {/* corner pin-1 marker */}
        <mesh position={[-0.45, 0.45, 0.09]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
          <meshStandardMaterial color={C.amber} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* CPU pins */}
        {cpuPins.map((p, i) => {
          let pos;
          if (p.side === "t") pos = [p.o, 0.62, -0.02];
          else if (p.side === "b") pos = [p.o, -0.62, -0.02];
          else if (p.side === "l") pos = [-0.62, p.o, -0.02];
          else pos = [0.62, p.o, -0.02];
          const horizontal = p.side === "t" || p.side === "b";
          return (
            <mesh key={i} position={pos}>
              <boxGeometry args={horizontal ? [0.06, 0.16, 0.04] : [0.16, 0.06, 0.04]} />
              <meshStandardMaterial color={COPPER} roughness={0.35} metalness={0.75} />
            </mesh>
          );
        })}
      </group>

      {/* ICs */}
      {leftChips.map((c, i) => (
        <Chip key={`lc${i}`} {...c} active={false} />
      ))}
      {rightChips.map((c, i) => (
        <Chip key={`rc${i}`} {...c} active dieRef={(el) => (rightDies.current[i] = el)} />
      ))}

      {/* capacitors */}
      {caps.map((cp, i) => (
        <group key={`cap${i}`} position={[cp.x, cp.y, FZ]}>
          <mesh castShadow position={[0, 0, cp.h / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[cp.r, cp.r, cp.h, 16]} />
            <meshStandardMaterial color={cp.dull ? DULL : "#2A3A4E"} roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0, cp.h]}>
            <cylinderGeometry args={[cp.r, cp.r, 0.03, 16]} />
            <meshStandardMaterial color={cp.top} roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* resistors */}
      {resistors.map((r, i) => (
        <group key={`r${i}`} position={[r.x, r.y, FZ + 0.02]}>
          <mesh castShadow>
            <boxGeometry args={[0.26, 0.1, 0.08]} />
            <meshStandardMaterial color="#3A2A1E" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[-0.15, 0, 0]}>
            <boxGeometry args={[0.06, 0.1, 0.05]} />
            <meshStandardMaterial color={COPPER} roughness={0.35} metalness={0.7} />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <boxGeometry args={[0.06, 0.1, 0.05]} />
            <meshStandardMaterial color={COPPER} roughness={0.35} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* header pin block */}
      <group position={[0, 1.72, FZ]}>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[1.9, 0.18, 0.06]} />
          <meshStandardMaterial color="#1c2a3a" roughness={0.5} metalness={0.4} />
        </mesh>
        {headerPins.map((x, i) => (
          <mesh key={i} position={[x, 0, 0.05]}>
            <boxGeometry args={[0.06, 0.06, 0.16]} />
            <meshStandardMaterial color={COPPER} roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* solder pads / vias */}
      {vias.map((v, i) => (
        <mesh key={`v${i}`} position={[v.x, v.y, FZ]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
          <meshStandardMaterial color={COPPER} roughness={0.4} metalness={0.7} />
        </mesh>
      ))}

      {/* travelling signal pulses (right half) */}
      <instancedMesh ref={sigRef} args={[null, null, SIG]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={C.tealBright} emissive={C.tealBright} emissiveIntensity={0.3} roughness={0.3} metalness={0.2} />
      </instancedMesh>
    </group>
  );
}
