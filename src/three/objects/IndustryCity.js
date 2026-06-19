import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useSceneStore } from "@/store/useSceneStore";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useClickPulses } from "@/three/objects/_useClickPulse";
import { C } from "@/config/theme";

// Deepened, solid industry colors that read well on the light ground.
const INDUSTRIES = [
  { key: "healthcare", color: C.teal, w: 0.9, h: 2.4, x: -3 },
  { key: "automotive", color: C.amber, w: 1.6, h: 1.2, x: -1.4 },
  { key: "construction", color: C.blue, w: 1.1, h: 1.8, x: 0.2 },
  { key: "professional", color: C.purple, w: 1.0, h: 2.8, x: 1.7 },
  { key: "manufacturing", color: C.green, w: 1.7, h: 1.4, x: 3.4 },
];

const WIN = "#E3EDF8"; // window glass on the light theme

// Object 9 - Isometric Industry City. Each building maps to an industry tab.
// Detailed low-poly buildings: window rows, rooftop units, foundation slabs.
export default function IndustryCity({ index = 8, quality = "high" }) {
  const focus = useFocus(index);
  const groupRef = useRef();
  const buildingRefs = useRef([]);
  const [pulses, pop] = useClickPulses(INDUSTRIES.length);
  const setSelection = useSceneStore((s) => s.setSelection);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    if (groupRef.current) groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.08;
    const sel = useSceneStore.getState().selection.industry;
    const rm = useSceneStore.getState().reducedMotion ? 0.35 : 1;
    const seqIdx = f > 0.5 ? Math.floor((t * 0.6) % INDUSTRIES.length) : -1;
    buildingRefs.current.forEach((m, i) => {
      if (!m) return;
      const pv = pulses.current[i].v * rm; // skyline pop 0..1
      const isSel = INDUSTRIES[i].key === sel;
      const lit = isSel || seqIdx === i;
      const target = (lit ? 0.32 : 0) + pv * 0.7;
      m.material.emissiveIntensity += (target - m.material.emissiveIntensity) * 0.1;
      const sy = (lit ? 1.04 : 1.0) + pv * 0.4;
      m.scale.y += (sy - m.scale.y) * 0.2;
    });
  });

  return (
    <group ref={groupRef} position={OBJECT_POSITIONS.cityBlock} {...hoverProps("cityBlock")} rotation={[0.15, 0, 0]}>
      {/* ground plaza */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 6]} />
        <meshStandardMaterial color="#DDE5F1" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* roads */}
      {[-1.2, 0, 1.2].map((z, i) => (
        <mesh key={i} position={[0, 0.011, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 0.12]} />
          <meshBasicMaterial color={C.line} transparent opacity={0.55} />
        </mesh>
      ))}
      {INDUSTRIES.map((b, i) => {
        const z = i % 2 === 0 ? -0.5 : 0.5;
        const floors = Math.max(2, Math.round(b.h / 0.55));
        const winY = [];
        const denom = floors - 1 || 1;
        for (let fI = 0; fI < floors; fI++) {
          winY.push(-b.h / 2 + 0.32 + (fI * (b.h - 0.6)) / denom);
        }
        return (
          <group key={b.key} position={[b.x, b.h / 2, z]}>
            {/* foundation slab */}
            <mesh position={[0, -b.h / 2 - 0.04, 0]} receiveShadow>
              <boxGeometry args={[b.w + 0.18, 0.1, b.w + 0.18]} />
              <meshStandardMaterial color="#C2CEE0" roughness={0.8} metalness={0.1} />
            </mesh>
            {/* building body */}
            <mesh
              ref={(el) => (buildingRefs.current[i] = el)}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                setSelection("industry", b.key);
                pop(i);
              }}
              {...hoverProps("cityBlock")}
            >
              <boxGeometry args={[b.w, b.h, b.w]} />
              <meshPhysicalMaterial color={b.color} emissive={b.color} emissiveIntensity={0} roughness={0.4} metalness={0.18} clearcoat={quality === "low" ? 0 : 0.6} clearcoatRoughness={0.28} envMapIntensity={1.1} />
            </mesh>
            {/* window rows on the two visible faces */}
            {winY.map((y, wi) => (
              <group key={wi}>
                <mesh position={[0, y, b.w / 2 + 0.012]}>
                  <boxGeometry args={[b.w * 0.78, 0.13, 0.02]} />
                  <meshStandardMaterial color={WIN} roughness={0.12} metalness={0.35} envMapIntensity={1.7} />
                </mesh>
                <mesh position={[b.w / 2 + 0.012, y, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[b.w * 0.78, 0.13, 0.02]} />
                  <meshStandardMaterial color={WIN} roughness={0.12} metalness={0.35} envMapIntensity={1.7} />
                </mesh>
              </group>
            ))}
            {/* rooftop units */}
            <mesh position={[0, b.h / 2 + 0.13, 0]} castShadow>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial color={b.color} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[b.w * 0.22, b.h / 2 + 0.08, -b.w * 0.18]} castShadow>
              <boxGeometry args={[0.2, 0.14, 0.26]} />
              <meshStandardMaterial color="#9FB0C8" roughness={0.5} metalness={0.3} />
            </mesh>
            {/* antenna */}
            <mesh position={[-b.w * 0.2, b.h / 2 + 0.22, b.w * 0.16]}>
              <cylinderGeometry args={[0.015, 0.015, 0.32, 6]} />
              <meshStandardMaterial color="#7C8AA3" roughness={0.4} metalness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
