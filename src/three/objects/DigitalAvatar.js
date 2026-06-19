import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";

// A low-poly humanoid: solid teal body + a subtle wireframe shell, with joint
// spheres and an amber chest core for a "digital human" read.
function Body(color) {
  return (
    <meshPhysicalMaterial color={color} roughness={0.34} metalness={0.2} clearcoat={0.6} clearcoatRoughness={0.28} envMapIntensity={1.15} />
  );
}
function Joint() {
  return <meshStandardMaterial color={C.tealBright} roughness={0.28} metalness={0.4} envMapIntensity={1.3} />;
}

function Figure() {
  return (
    <group>
      {/* head */}
      <mesh position={[0, 1.98, 0]} castShadow>
        <icosahedronGeometry args={[0.26, 1]} />
        {Body(C.teal)}
      </mesh>
      <mesh position={[0, 1.98, 0]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={C.tealBright} wireframe transparent opacity={0.45} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.16, 8]} />
        {Joint()}
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.66, 6, 12]} />
        {Body(C.teal)}
      </mesh>
      <mesh position={[0, 1.18, 0]}>
        <capsuleGeometry args={[0.33, 0.68, 4, 10]} />
        <meshStandardMaterial color={C.tealBright} wireframe transparent opacity={0.35} />
      </mesh>
      {/* chest core */}
      <mesh position={[0, 1.28, 0.24]}>
        <icosahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={C.amber} roughness={0.3} metalness={0.45} />
      </mesh>
      {/* shoulders */}
      <mesh position={[-0.4, 1.48, 0]}><sphereGeometry args={[0.13, 12, 12]} />{Joint()}</mesh>
      <mesh position={[0.4, 1.48, 0]}><sphereGeometry args={[0.13, 12, 12]} />{Joint()}</mesh>
      {/* arms */}
      <mesh position={[-0.48, 1.12, 0]} rotation={[0, 0, 0.28]} castShadow>
        <capsuleGeometry args={[0.1, 0.66, 4, 8]} />
        {Body(C.teal)}
      </mesh>
      <mesh position={[0.48, 1.12, 0]} rotation={[0, 0, -0.28]} castShadow>
        <capsuleGeometry args={[0.1, 0.66, 4, 8]} />
        {Body(C.teal)}
      </mesh>
      {/* hands */}
      <mesh position={[-0.62, 0.74, 0]}><sphereGeometry args={[0.1, 10, 10]} />{Joint()}</mesh>
      <mesh position={[0.62, 0.74, 0]}><sphereGeometry args={[0.1, 10, 10]} />{Joint()}</mesh>
      {/* pelvis */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.42, 0.2, 0.28]} />
        {Body(C.teal)}
      </mesh>
      {/* hips */}
      <mesh position={[-0.16, 0.68, 0]}><sphereGeometry args={[0.12, 12, 12]} />{Joint()}</mesh>
      <mesh position={[0.16, 0.68, 0]}><sphereGeometry args={[0.12, 12, 12]} />{Joint()}</mesh>
      {/* legs */}
      <mesh position={[-0.18, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.7, 4, 8]} />
        {Body(C.teal)}
      </mesh>
      <mesh position={[0.18, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.7, 4, 8]} />
        {Body(C.teal)}
      </mesh>
      {/* feet */}
      <mesh position={[-0.18, -0.06, 0.06]}><boxGeometry args={[0.16, 0.08, 0.3]} />{Joint()}</mesh>
      <mesh position={[0.18, -0.06, 0.06]}><boxGeometry args={[0.16, 0.08, 0.3]} />{Joint()}</mesh>
    </group>
  );
}

// Object 6 - Digital Human Avatar. Cube (Build), rings (Automate), cone (Scale)
// orbit the figure; on focus they drift into a vertical column in front.
export default function DigitalAvatar({ index = 5, quality = "high" }) {
  const focus = useFocus(index);
  const [pulse, burst] = useClickPulse({ up: 0.18, down: 0.95 });
  const cubeRef = useRef();
  const ringsRef = useRef();
  const coneRef = useRef();
  const figureRef = useRef();
  const baseRingRef = useRef();
  const shockRef = useRef();
  const flareRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const f = focus.current;
    const pv = pulse.current.v * (useSceneStore.getState().reducedMotion ? 0.35 : 1); // power-up
    if (figureRef.current) figureRef.current.scale.y = 1 + Math.sin(t * 1.0) * 0.015 + pv * 0.12;
    if (baseRingRef.current) baseRingRef.current.rotation.z = t * 0.4;

    // expanding shockwave ring rising from the base
    if (shockRef.current) {
      const on = pv > 0.001;
      shockRef.current.visible = on;
      if (on) {
        const s = 0.6 + pv * 4.5;
        shockRef.current.scale.set(s, s, s);
        shockRef.current.position.y = -0.05 + (1 - pulse.current.v) * 2.2;
        shockRef.current.material.opacity = (1 - pulse.current.v) * 0.55;
      }
    }
    // chest core flare
    if (flareRef.current) {
      flareRef.current.material.emissiveIntensity = pv * 2.4;
      const s = 1 + pv * 0.8;
      flareRef.current.scale.set(s, s, s);
    }

    const orbitR = THREE.MathUtils.lerp(1.4, 0.0, f);
    const colX = THREE.MathUtils.lerp(0, 1.6, f);

    if (cubeRef.current) {
      const a = t * 0.8;
      cubeRef.current.position.set(colX + Math.cos(a) * orbitR, 1.95, Math.sin(a) * orbitR);
      cubeRef.current.rotation.x += 0.01;
      cubeRef.current.rotation.y += 0.012;
    }
    if (ringsRef.current) {
      const a = t * 0.6 + 2;
      ringsRef.current.position.set(colX + Math.cos(a) * orbitR, 1.15, Math.sin(a) * orbitR);
      ringsRef.current.rotation.x += 0.02;
      ringsRef.current.rotation.y += 0.018;
    }
    if (coneRef.current) {
      const a = t * 0.7 + 4;
      coneRef.current.position.set(colX + Math.cos(a) * orbitR, 0.4, Math.sin(a) * orbitR);
      const s = 0.8 + Math.sin(t * 1.2) * 0.2;
      coneRef.current.scale.set(1, s, 1);
      coneRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group
      position={OBJECT_POSITIONS.avatar}
      {...hoverProps("avatar")}
      onClick={(e) => {
        e.stopPropagation();
        burst();
      }}
    >
      {/* base platform */}
      <mesh position={[0, -0.18, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.12, 32]} />
        <meshStandardMaterial color="#C2CEE0" roughness={0.65} metalness={0.2} />
      </mesh>
      <mesh ref={baseRingRef} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.03, 10, 48]} />
        <meshStandardMaterial color={C.teal} roughness={0.35} metalness={0.45} />
      </mesh>

      <group ref={figureRef}>
        <Figure />
      </group>

      {/* click power-up: chest core flare + expanding shockwave ring */}
      <mesh ref={flareRef} position={[0, 1.28, 0.24]}>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color={C.amber} emissive={C.amber} emissiveIntensity={0} roughness={0.3} metalness={0.45} />
      </mesh>
      <mesh ref={shockRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.03, 10, 48]} />
        <meshBasicMaterial color={C.tealBright} transparent opacity={0} />
      </mesh>

      <mesh ref={cubeRef} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={C.teal} roughness={0.4} metalness={0.3} />
      </mesh>
      <group ref={ringsRef}>
        <mesh>
          <torusGeometry args={[0.32, 0.05, 8, 40]} />
          <meshStandardMaterial color={C.amber} roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.05, 8, 40]} />
          <meshStandardMaterial color={C.amber} roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
      <mesh ref={coneRef} castShadow>
        <coneGeometry args={[0.32, 0.6, 5]} />
        <meshStandardMaterial color={C.blue} roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}
