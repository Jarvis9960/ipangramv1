import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import { OBJECT_POSITIONS } from "@/config/checkpoints";
import { useFocus, hoverProps } from "@/three/objects/_useFocus";
import { useTransition } from "@/three/objects/_useTransition";
import { useClickPulse } from "@/three/objects/_useClickPulse";
import { useSceneStore } from "@/store/useSceneStore";
import { NEURAL_HOTSPOTS } from "@/config/neuralHotspots";

const MODEL_URL = `${process.env.PUBLIC_URL}/models/neural_networks_of_the_brain.glb`;
useGLTF.preload(MODEL_URL);

const TARGET_SIZE = 3.3; // max dimension after normalisation

// Light-green glass shell over "light black" inner networks.
const SHELL_GREEN = "#A9E2C4";
const INNER_BLACK = "#2E323A";
const INNER_GLOW = "#7B828F";

// Object 1 - Neural Core Hub (Hero). Real brain GLB: a translucent glass shell
// over glowing inner "neural network" lobes. Three numbered hotspots annotate
// our core business systems.
export default function NeuralCoreHub({ index = 0, quality = "high" }) {
  const group = useRef();
  const netMatsRef = useRef([]);
  const focus = useFocus(index);
  const tr = useTransition(index);
  const [pulse, burst] = useClickPulse();

  const activeIndex = useSceneStore((s) => s.activeIndex);
  const isMobile = useSceneStore((s) => s.isMobile);
  const showHotspots = activeIndex === index && !isMobile;
  const [openNum, setOpenNum] = useState(null);
  const [hoverNum, setHoverNum] = useState(null);

  const { scene } = useGLTF(MODEL_URL);

  // Clone the cached scene, recentre + scale it to the rig's footprint, and swap
  // in region-coloured materials so the three hotspots map onto three visibly
  // different parts of the brain: FRONT shell (teal), INNER networks (amber),
  // BACK shell (blue). Cloned materials only — the shared gltf cache is never
  // mutated, so re-mounts stay clean. Returns the model + per-region anchors so
  // each numbered dot sits directly on its coloured region.
  const { model, anchors } = useMemo(() => {
    const root = scene.clone(true);
    const nets = [];
    const front = [];
    const back = [];
    const inner = [];

    const glass = (col) =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(col),
        metalness: 0,
        roughness: 0.12,
        transmission: quality === "high" ? 0.5 : 0,
        thickness: 0.6,
        ior: 1.3,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
        transparent: true,
        opacity: quality === "high" ? 0.34 : 0.3,
        depthWrite: false,
        envMapIntensity: 0.8,
        side: THREE.DoubleSide,
      });

    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = quality === "high";
      o.receiveShadow = false;
      const src = o.material;
      const name = o.name || "";
      if (src && src.transparent) {
        // translucent brain shell -> uniform light grey glass; still track the
        // front / back regions so the hotspot dots anchor onto them.
        o.material = glass(SHELL_GREEN);
        if (/Front/i.test(name)) front.push(o);
        else if (/Back/i.test(name)) back.push(o);
      } else if (src) {
        // inner networks -> "light black" charcoal with a soft grey glow
        const net = src.clone();
        net.map = null;
        net.emissiveMap = null;
        net.color = new THREE.Color(INNER_BLACK);
        net.emissive = new THREE.Color(INNER_GLOW);
        net.emissiveIntensity = 0.45;
        net.roughness = 0.55;
        net.metalness = 0.1;
        net.envMapIntensity = 1.0;
        o.material = net;
        nets.push(net);
        inner.push(o);
      }
    });

    // recentre to origin + scale so max dimension ≈ TARGET_SIZE
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = TARGET_SIZE / maxDim;
    root.scale.setScalar(s);
    root.position.set(-center.x * s, -center.y * s, -center.z * s);
    root.updateMatrixWorld(true);

    // Anchor each hotspot on the centroid of its region, pushed outward so the
    // dot floats just off the surface of that coloured area.
    const anchorFor = (meshes, fallback, push = 0.45) => {
      if (!meshes.length) return fallback;
      const b = new THREE.Box3();
      meshes.forEach((m) => b.expandByObject(m));
      const c = new THREE.Vector3();
      b.getCenter(c);
      const dir = c.clone();
      if (dir.lengthSq() < 1e-3) dir.set(0, 1, 0);
      dir.normalize();
      c.addScaledVector(dir, push);
      return [c.x, c.y, c.z];
    };

    netMatsRef.current = nets;
    return {
      model: root,
      anchors: {
        1: anchorFor(front, [-1.35, 0.45, 0.9]),
        2: anchorFor(inner, [0, 0.3, 0], 0.9),
        3: anchorFor(back, [0, 1.35, -0.4]),
      },
    };
  }, [scene, quality]);

  const spin = useRef(0); // accumulated yaw for the straight spin

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const f = focus.current;
    const store = useSceneStore.getState();
    const pv = pulse.current.v * (store.reducedMotion ? 0.35 : 1); // detonation 0..1

    // straight auto-rotate around the vertical axis only — no pointer lean/tilt
    const rotSpeed = THREE.MathUtils.lerp(0.0032, 0.0008, f);
    spin.current += rotSpeed * 60 * delta;
    g.rotation.set(0, spin.current, 0);

    // Hidden during the hero (beat 0): the hub only reveals + grows in as the
    // camera flies through the network toward it (beat 1). Folded into the
    // assemble-on-arrival scale so it appears to materialise from nothing.
    const reveal = THREE.MathUtils.smoothstep(store.scrollProgress, 0.02, 0.08);
    g.visible = reveal > 0.001;
    g.scale.setScalar(THREE.MathUtils.lerp(1.4, 1, tr.current) * reveal);
    if (!g.visible) return;

    // networks breathe + flare on focus / click
    const glow = 0.4 + f * 0.8 + pv * 2.0 + 0.12 * Math.sin(t * 1.6);
    for (const m of netMatsRef.current) m.emissiveIntensity = glow;
  });

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
      <primitive object={model} />

      {showHotspots &&
        NEURAL_HOTSPOTS.map((h) => {
          const open = openNum === h.num || hoverNum === h.num;
          return (
            <Html key={h.num} position={anchors[h.num] || h.anchor} center zIndexRange={[120, 0]} style={{ pointerEvents: "none" }}>
              <div
                className="relative flex items-center justify-center"
                style={{ pointerEvents: "auto" }}
                onPointerEnter={() => setHoverNum(h.num)}
                onPointerLeave={() => setHoverNum(null)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenNum((n) => (n === h.num ? null : h.num));
                  }}
                  className="w-6 h-6 rounded-full font-mono text-[11px] font-semibold text-white grid place-items-center shadow-[0_4px_12px_-4px_rgba(16,32,58,0.5)] ring-2 ring-white/80 transition-transform hover:scale-110"
                  style={{ background: h.color }}
                  aria-label={h.title}
                >
                  {h.num}
                </button>
                {open && (
                  <div
                    className="absolute left-1/2 bottom-[160%] -translate-x-1/2 w-[220px] pl-3 pr-3 py-2 rounded-[12px] bg-[rgba(255,255,255,0.97)] border border-[rgba(16,32,58,0.1)] border-l-[3px] backdrop-blur-[12px] shadow-[0_12px_32px_-12px_rgba(16,32,58,0.4)]"
                    style={{ borderLeftColor: h.color }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="shrink-0 w-4 h-4 rounded-full grid place-items-center font-mono text-[9px] font-bold text-white"
                        style={{ background: h.color }}
                      >
                        {h.num}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.08em] uppercase font-semibold" style={{ color: h.color }}>
                        {h.title}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-[#3F4F6B]">{h.body}</p>
                  </div>
                )}
              </div>
            </Html>
          );
        })}
    </group>
  );
}
