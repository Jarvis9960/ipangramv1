import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { C } from "@/config/theme";

// Subtle floating dust particles for depth (tuned for the grey background).
export default function GlobalParticles({ count = 160, reducedMotion = false }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = -Math.random() * 130 + 10;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (ref.current && !reducedMotion) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.004;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={C.particle} transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}
