import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useSceneStore } from "@/store/useSceneStore";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useTransition } from "@/three/objects/_useTransition";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { C } from "@/config/theme";

const LABELS = ["Sales Worker", "Front Desk", "Customer Service", "Knowledge Worker", "Operations", "Executive"];

// Build a label as a canvas texture (no font-loading dependency).
// Light theme: white pill, ink text, teal border; highlighted = solid teal pill.
function makeLabelTexture(text, highlight) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 96;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 320, 96);
  // pill background
  ctx.fillStyle = highlight ? "rgba(14,158,134,0.96)" : "rgba(255,255,255,0.94)";
  const r = 18;
  ctx.beginPath();
  ctx.moveTo(r, 8);
  ctx.arcTo(312, 8, 312, 88, r);
  ctx.arcTo(312, 88, 8, 88, r);
  ctx.arcTo(8, 88, 8, 8, r);
  ctx.arcTo(8, 8, 312, 8, r);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = highlight ? "#0B8A75" : "rgba(14,27,48,0.16)";
  ctx.stroke();
  ctx.fillStyle = highlight ? "#FFFFFF" : "#0E1B30";
  ctx.font = "600 30px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 160, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// Object 7 - Voice Waveform Sphere. A point-cloud sphere deformed by a sine
// waveform, surrounded by orbiting worker label cards.
export default function WaveformOrb({ index = 6, quality = "high" }) {
  const focus = useFocus(index);
  const tr = useTransition(index);
  const [pulse, burst] = useClickPulse({ up: 0.16, down: 0.95 });
  const pointsRef = useRef();
  const groupRef = useRef();
  const labelRefs = useRef([]);
  const tilt = useRef({ x: 0, z: 0 });

  const COUNT = quality === "low" ? 1400 : 3000;
  const R = 1.0;

  const { dirs, positions, colors } = useMemo(() => {
    const dirs = [];
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    // Deep teal -> bright teal gradient so the sphere reads clearly on light bg.
    const deep = new THREE.Color("#0A6F5F");
    const bright = new THREE.Color("#16C2A6");
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const d = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
      dirs.push(d);
      positions[i * 3] = d.x * R;
      positions[i * 3 + 1] = d.y * R;
      positions[i * 3 + 2] = d.z * R;
      const cc = deep.clone().lerp(bright, (y + 1) / 2);
      colors[i * 3] = cc.r;
      colors[i * 3 + 1] = cc.g;
      colors[i * 3 + 2] = cc.b;
    }
    return { dirs, positions, colors };
  }, [COUNT]);

  // Two textures per label: normal + highlighted.
  const labelTextures = useMemo(
    () => LABELS.map((l) => ({ normal: makeLabelTexture(l, false), hot: makeLabelTexture(l, true) })),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const store = useSceneStore.getState();
    // Fast scrolling churns the waveform; the orb also leans toward the pointer.
    const vel = store.reducedMotion ? 0 : store.scrollVelocity;
    const ptr = store.pointer;
    if (groupRef.current) {
      const lean = store.reducedMotion ? 0 : f;
      const k = Math.min(1, delta * 4);
      tilt.current.x += (ptr.y * 0.22 * lean - tilt.current.x) * k;
      tilt.current.z += (-ptr.x * 0.22 * lean - tilt.current.z) * k;
      groupRef.current.rotation.set(tilt.current.x, t * 0.18, tilt.current.z);
    }
    const pv = pulse.current.v * (store.reducedMotion ? 0.35 : 1); // sonar ping
    const amp = 0.05 + f * 0.16 + vel * 0.12 + pv * 0.45;
    const freq = 6 + f * 4 + vel * 5;
    // Assemble: points fly in from a wider cloud + fade up as the orb forms.
    const a = tr.current;
    const spread = (1 + (1 - a) * 1.8) * (1 + pv * 0.45);
    if (pointsRef.current) {
      const arr = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < dirs.length; i++) {
        const d = dirs[i];
        const lon = Math.atan2(d.z, d.x);
        const lat = Math.asin(d.y);
        const disp = Math.sin(lon * freq + t * 3) * Math.cos(lat * 3) * amp;
        const rr = (R + disp) * spread;
        arr[i * 3] = d.x * rr;
        arr[i * 3 + 1] = d.y * rr;
        arr[i * 3 + 2] = d.z * rr;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.material.opacity = 0.2 + a * 0.75;
    }
    const selWorker = useSceneStore.getState().selection.worker;
    labelRefs.current.forEach((grp, i) => {
      if (!grp) return;
      const a = (i / LABELS.length) * Math.PI * 2 + t * 0.25;
      const radius = 1.9 + (i % 2) * 0.4 + pv * 0.7;
      const yy = Math.sin(t * 0.5 + i) * 0.3 + (i % 3 - 1) * 0.4;
      grp.position.set(Math.cos(a) * radius, yy, Math.sin(a) * radius);
      const hot = selWorker === i;
      const s = hot ? 1.35 : 1.0;
      grp.scale.x += (s - grp.scale.x) * 0.15;
      grp.scale.y = grp.scale.x;
      grp.scale.z = grp.scale.x;
      const mesh = grp.children?.[0]?.children?.[0];
      if (mesh && mesh.material) {
        const tex = hot ? labelTextures[i].hot : labelTextures[i].normal;
        if (mesh.material.map !== tex) mesh.material.map = tex;
      }
    });
  });

  return (
    <group
      position={OBJECT_POSITIONS.waveformOrb}
      {...hoverProps("waveformOrb")}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      <group ref={groupRef}>
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={COUNT} array={colors} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={0.032} vertexColors transparent opacity={0.95} sizeAttenuation />
        </points>
      </group>
      {LABELS.map((label, i) => (
        <group key={i} ref={(el) => (labelRefs.current[i] = el)}>
          <Billboard>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                useSceneStore.getState().setSelection("worker", i);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                useSceneStore.getState().setSelection("worker", null);
              }}
            >
              <planeGeometry args={[0.95, 0.285]} />
              <meshBasicMaterial map={labelTextures[i].normal} transparent />
            </mesh>
          </Billboard>
        </group>
      ))}
    </group>
  );
}
