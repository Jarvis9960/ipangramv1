import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";

// Light-theme dashboard screens: light panels, ink gridlines, teal/amber data.
function makeDashTexture(kind) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  const draw = (phase) => {
    ctx.fillStyle = "#F2F6FC";
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = "rgba(14,27,48,0.10)";
    ctx.lineWidth = 1;
    for (let y = 20; y < 160; y += 28) {
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(244, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#0E9E86";
    if (kind === "bars") {
      for (let i = 0; i < 7; i++) {
        const h = 30 + Math.abs(Math.sin(phase + i * 0.6)) * 90;
        ctx.fillRect(20 + i * 32, 150 - h, 18, h);
      }
    } else if (kind === "line") {
      ctx.beginPath();
      ctx.moveTo(12, 120);
      for (let x = 0; x <= 232; x += 8) {
        const y = 120 - (x / 232) * 70 - Math.sin(phase + x * 0.05) * 10;
        ctx.lineTo(12 + x, y);
      }
      ctx.strokeStyle = "#0E9E86";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // gauge
      ctx.strokeStyle = "rgba(14,27,48,0.14)";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(128, 110, 60, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = "#E08A0B";
      const val = 0.35 + (Math.sin(phase) * 0.5 + 0.5) * 0.6;
      ctx.beginPath();
      ctx.arc(128, 110, 60, Math.PI, Math.PI + Math.PI * val);
      ctx.stroke();
      ctx.fillStyle = "#0E1B30";
      ctx.font = "bold 26px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(Math.round(val * 100) + "%", 128, 100);
    }
    ctx.fillStyle = "rgba(14,158,134,0.9)";
    ctx.fillRect(12, 8, 40, 4);
    tex.needsUpdate = true;
  };
  draw(0);
  return { tex, draw };
}

// Object 10 - Orbital Dashboard. 3 screens + a 5-step process path.
export default function OrbitalDashboard({ index = 9, quality = "high" }) {
  const focus = useFocus(index);
  const [pulse, burst] = useClickPulse({ up: 0.5, down: 0.6, ease: "power2.inOut" });
  const groupRef = useRef();
  const screenRefs = useRef([]);
  const orbRefs = useRef([]);
  const lastDraw = useRef(0);

  const dashboards = useMemo(() => [makeDashTexture("bars"), makeDashTexture("gauge"), makeDashTexture("line")], []);
  const screens = useMemo(
    () => [
      { angle: -0.5, color: C.teal },
      { angle: 0, color: C.teal },
      { angle: 0.5, color: C.teal },
    ],
    []
  );
  const orbPositions = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 5; i++) pts.push(new THREE.Vector3((i - 2) * 0.85, -1.7, 0));
    return pts;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const pv = pulse.current.v * (useSceneStore.getState().reducedMotion ? 0.35 : 1); // refresh spin
    if (groupRef.current) groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.25 * (1 - f);

    if (t - lastDraw.current > 0.6) {
      lastDraw.current = t;
      dashboards.forEach((d, i) => d.draw(t + i));
    }

    screenRefs.current.forEach((m, i) => {
      if (!m) return;
      const spread = THREE.MathUtils.lerp(0.55, 1.05, f) * (1 + pv * 0.25);
      const ang = screens[i].angle * spread;
      m.position.set(Math.sin(ang) * 2.4, 0.2, Math.cos(ang) * 0.6 - 0.6);
      m.rotation.y = -ang + pv * Math.PI * 2; // full flip on refresh
    });

    const step = Math.floor((t * 1.0) % 5);
    orbRefs.current.forEach((m, i) => {
      if (!m) return;
      const lit = i === step;
      const target = (lit ? 0.4 : 0) + pv * 0.7;
      m.material.emissiveIntensity += (target - m.material.emissiveIntensity) * 0.15;
      m.scale.setScalar((lit ? 1.3 : 1.0) + pv * 0.5);
    });
  });

  return (
    <group
      ref={groupRef}
      position={OBJECT_POSITIONS.dashboards}
      {...hoverProps("dashboards")}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      {screens.map((s, i) => (
        <group key={i} ref={(el) => (screenRefs.current[i] = el)}>
          <mesh>
            <planeGeometry args={[2.0, 1.25]} />
            <meshBasicMaterial map={dashboards[i].tex} transparent opacity={0.98} />
          </mesh>
          {/* screen edge frame */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(2.04, 1.29)]} />
            <lineBasicMaterial color={s.color} transparent opacity={0.6} />
          </lineSegments>
        </group>
      ))}
      {/* process path line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={5}
            array={new Float32Array(orbPositions.flatMap((p) => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={C.line} />
      </line>
      {orbPositions.map((p, i) => (
        <mesh key={i} position={p} ref={(el) => (orbRefs.current[i] = el)} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={C.teal} emissive={C.teal} emissiveIntensity={0} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
