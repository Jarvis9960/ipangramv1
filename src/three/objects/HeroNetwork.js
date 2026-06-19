import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";

// Object 0 - HERO fly-through network ("Living IT Ecosystem"). A 3D web of nodes,
// links and travelling data pulses that the camera flies through on scroll. As
// the camera advances to beat 1 the web fades (focus -> 0) and parts to reveal
// the Neural Core Hub behind it. Idle drift + pointer parallax keep it alive.
export default function HeroNetwork({ index = 0, quality = "high" }) {
  const group = useRef();
  const nodesRef = useRef();
  const linesRef = useRef();
  const pulseRef = useRef();
  const colored = useRef(false); // node colours are static — set them only once
  const [ping, burst] = useClickPulse({ up: 0.16, down: 1.0 });

  const NODE_COUNT = quality === "low" ? 70 : quality === "mid" ? 120 : 160;

  // Nodes scattered through a wide, shallow box volume (local space). The group
  // sits at OBJECT_POSITIONS.heroNet so it fills the frame in front of the hub.
  const { nodes, edgeGeometry, edges } = useMemo(() => {
    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const kind = Math.random() < 0.14 ? "teal" : Math.random() < 0.06 ? "amber" : "node";
      nodes.push({
        p: new THREE.Vector3(
          (Math.random() - 0.5) * 9.5,
          (Math.random() - 0.5) * 6.5,
          (Math.random() - 0.5) * 6
        ),
        kind,
        phase: Math.random() * Math.PI * 2,
        amp: 0.08 + Math.random() * 0.22,
      });
    }
    // Near-neighbour links (capped per node) for a stable web.
    const positions = [];
    const edges = [];
    const threshold = 1.7;
    for (let i = 0; i < nodes.length; i++) {
      let cnt = 0;
      for (let j = i + 1; j < nodes.length; j++) {
        if (cnt > 3) break;
        if (nodes[i].p.distanceTo(nodes[j].p) < threshold) {
          const a = nodes[i].p;
          const b = nodes[j].p;
          positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
          edges.push([a, b]);
          cnt++;
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return { nodes, edgeGeometry: geo, edges };
  }, [NODE_COUNT]);

  const PULSES = quality === "low" ? 36 : quality === "mid" ? 70 : 110;
  const pulses = useMemo(
    () =>
      Array.from({ length: PULSES }, () => ({
        edge: Math.floor(Math.random() * Math.max(1, edges.length)),
        t: Math.random(),
        speed: 0.3 + Math.random() * 0.9,
      })),
    [PULSES, edges.length]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const tealC = useMemo(() => new THREE.Color(C.teal), []);
  const amberC = useMemo(() => new THREE.Color(C.amber), []);
  const inkC = useMemo(() => new THREE.Color(C.ink), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const store = useSceneStore.getState();
    const reduced = store.reducedMotion;
    const pv = ping.current.v * (reduced ? 0.35 : 1);
    const g = group.current;
    if (!g) return;

    // Alive at idle: the whole web slowly turns + "breathes", with pointer
    // parallax layered on. (Skipped under reduced motion.)
    if (!reduced) {
      g.rotation.y = t * 0.1 + store.pointer.x * 0.2;
      g.rotation.x = Math.sin(t * 0.25) * 0.07 + store.pointer.y * -0.12;
      g.scale.setScalar(1 + Math.sin(t * 0.45) * 0.03);
    } else {
      g.rotation.set(0, 0, 0);
      g.scale.setScalar(1);
    }

    // Fade the web out early (by ~0.055 scroll progress) — before the camera
    // frames the hub — so the hub beat is clean (no web lingering around it).
    const vis = 1 - THREE.MathUtils.smoothstep(store.scrollProgress, 0.02, 0.055);
    g.visible = vis > 0.02;
    if (!g.visible) return;

    if (nodesRef.current) {
      const setColors = !colored.current;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const drift = reduced ? 0 : Math.sin(t * 0.85 + n.phase) * n.amp * 1.5;
        const twinkle = reduced ? 1 : 0.82 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6 + n.phase));
        const big = n.kind !== "node";
        dummy.position.set(n.p.x, n.p.y + drift, n.p.z);
        dummy.scale.setScalar((big ? 0.07 : 0.045) * twinkle * (1 + pv * 0.8));
        dummy.updateMatrix();
        nodesRef.current.setMatrixAt(i, dummy.matrix);
        // Colours are static per node — write them only on the first frame.
        if (setColors) {
          if (n.kind === "teal") tmp.copy(tealC);
          else if (n.kind === "amber") tmp.copy(amberC);
          else tmp.copy(inkC).lerp(tealC, 0.25);
          nodesRef.current.setColorAt(i, tmp);
        }
      }
      nodesRef.current.instanceMatrix.needsUpdate = true;
      if (setColors && nodesRef.current.instanceColor) {
        nodesRef.current.instanceColor.needsUpdate = true;
        colored.current = true;
      }
      nodesRef.current.material.opacity = vis;
    }

    if (linesRef.current?.material) linesRef.current.material.opacity = vis * 0.5;

    if (pulseRef.current && edges.length) {
      for (let i = 0; i < pulses.length; i++) {
        const s = pulses[i];
        if (!reduced) s.t += s.speed * delta * 1.0 * (1 + pv * 4);
        if (s.t > 1) {
          s.t = 0;
          s.edge = Math.floor(Math.random() * edges.length);
        }
        const e = edges[s.edge];
        const p = e[0].clone().lerp(e[1], s.t);
        dummy.position.copy(p);
        dummy.scale.setScalar(0.05 * (1 + pv));
        dummy.updateMatrix();
        pulseRef.current.setMatrixAt(i, dummy.matrix);
      }
      pulseRef.current.instanceMatrix.needsUpdate = true;
      pulseRef.current.material.opacity = vis;
      pulseRef.current.material.emissiveIntensity = vis * (0.8 + pv * 1.5);
    }
  });

  // The web is a purely decorative background — make it transparent to the
  // raycaster so it never intercepts hover/click from the objects behind it
  // (otherwise the lingering web blocks the hub's hover label at beat 1).
  const noRaycast = useMemo(() => () => null, []);

  return (
    <group ref={group} position={OBJECT_POSITIONS.heroNet} onClick={(e) => { e.stopPropagation(); burst(); }}>
      <instancedMesh ref={nodesRef} args={[null, null, nodes.length]} raycast={noRaycast}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial vertexColors color="#ffffff" transparent opacity={1} roughness={0.35} metalness={0.18} envMapIntensity={1.1} />
      </instancedMesh>

      <lineSegments ref={linesRef} geometry={edgeGeometry} raycast={noRaycast}>
        <lineBasicMaterial color={C.line} transparent opacity={0.34} />
      </lineSegments>

      <instancedMesh ref={pulseRef} args={[null, null, pulses.length]} raycast={noRaycast}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color={C.tealBright} emissive={C.tealBright} emissiveIntensity={0.8} transparent opacity={1} roughness={0.3} metalness={0.2} />
      </instancedMesh>
    </group>
  );
}
