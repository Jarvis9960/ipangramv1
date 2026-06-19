import React, { useMemo } from "react";
import * as THREE from "three";

// Distant soft glow regions (blue / purple / amber) to add depth + warmth.
export default function NebulaLights() {
  const lights = useMemo(
    () => [
      { pos: [25, 12, -40], color: "#2563EB", intensity: 0.06 },
      { pos: [-28, -10, -70], color: "#7C3AED", intensity: 0.06 },
      { pos: [20, -8, -100], color: "#F59E0B", intensity: 0.05 },
      { pos: [-22, 14, -20], color: "#00D4AA", intensity: 0.05 },
    ],
    []
  );
  return (
    <>
      {lights.map((l, i) => (
        <pointLight key={i} position={l.pos} color={l.color} intensity={l.intensity} distance={120} decay={1} />
      ))}
    </>
  );
}
