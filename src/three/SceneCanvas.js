import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import CameraRig from "@/three/CameraRig";
import GlobalParticles from "@/three/objects/GlobalParticles";
import SceneObjects from "@/three/SceneObjects";
import Effects from "@/three/Effects";
import { useSceneStore } from "@/store/useSceneStore";
import { C } from "@/config/theme";

// Procedural studio HDRI built from Lightformers — gives every PBR material
// real image-based reflections + soft fill without fetching an external .hdr
// (so it can never fail to load). A calm, bright, slightly cool studio with a
// warm kicker for life, plus rim strips that pick out edges on metal.
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      <color attach="background" args={["#dfe6f0"]} />
      {/* Soft key from upper-front */}
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#ffffff"
        position={[0, 4.5, 4]}
        rotation={[-Math.PI / 4, 0, 0]}
        scale={[12, 7, 1]}
      />
      {/* Cool fill from the left */}
      <Lightformer
        form="rect"
        intensity={1.0}
        color="#dce6f5"
        position={[-6, 2, 2]}
        rotation={[0, Math.PI / 3, 0]}
        scale={[7, 7, 1]}
      />
      {/* Warm kicker from the right */}
      <Lightformer
        form="rect"
        intensity={0.85}
        color="#ffe7c6"
        position={[6, 1, 1]}
        rotation={[0, -Math.PI / 3, 0]}
        scale={[6, 6, 1]}
      />
      {/* Gentle ground bounce */}
      <Lightformer
        form="rect"
        intensity={0.55}
        color="#e3e9f2"
        position={[0, -5, 2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 12, 1]}
      />
      {/* Rim strips behind for crisp edge highlights on metal */}
      <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-4, 3, -6]} scale={[6, 0.5, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#dbe6ff" position={[4, -1, -6]} scale={[6, 0.5, 1]} />
    </Environment>
  );
}

// NOTE: the quality tier is chosen once at startup (computeTier) and must stay
// fixed for the session. Several objects size their geometry/instance buffers
// from the tier (e.g. GlobalParticles 160/90/50, WaveformOrb 3000/1400), and
// Three.js cannot resize an existing GPU buffer — switching the tier live throws
// "Resizing buffer attributes is not supported". So there is intentionally no
// runtime PerformanceMonitor here; the heavier effects are gated by the stable
// startup tier instead.

// Light-theme scene canvas. HDRI-based image lighting + a soft key for clean,
// premium PBR shading; tiered post-processing (see Effects). The "low" tier
// keeps the original flat daylight look for performance.
export default function SceneCanvas() {
  const quality = useSceneStore((s) => s.qualityTier);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const particleCount = quality === "high" ? 100 : quality === "mid" ? 60 : 40;
  const useEnv = quality !== "low";
  // Smoothness-first: the reflective floor is an extra full render pass — drop it.
  const useFloor = false;

  return (
    <Canvas
      gl={{ antialias: quality !== "low", powerPreference: "high-performance", alpha: false }}
      dpr={[1, quality === "high" ? 1.5 : quality === "mid" ? 1.25 : 1]}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 0, 11] }}
      shadows={quality === "high"}
      onCreated={({ gl }) => {
        // On composer tiers (high/mid) the ToneMapping effect applies ACES last,
        // so disable the renderer's tone mapping to avoid applying it twice.
        // On "low" (no composer) the renderer handles ACES itself.
        gl.toneMapping = useEnv ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={[C.bg]} />
      <fogExp2 attach="fog" args={[C.fog, 0.02]} />

      <Suspense fallback={null}>
        {useEnv && <StudioEnvironment />}

        {/* Direct rig — reduced now that the HDRI provides fill, so surfaces
            stay clean and don't blow out. Key light still casts soft shadows. */}
        <ambientLight intensity={useEnv ? 0.32 : 0.7} color="#ffffff" />
        <hemisphereLight args={["#ffffff", "#c4d1e6", useEnv ? 0.45 : 0.9]} />
        <directionalLight
          position={[6, 10, 7]}
          intensity={useEnv ? 0.9 : 1.15}
          color="#ffffff"
          castShadow={quality === "high"}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-radius={6}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-7, 4, -3]} intensity={useEnv ? 0.28 : 0.4} color="#dce6f5" />

        <SceneObjects />
        <GlobalParticles count={particleCount} reducedMotion={reducedMotion} />

        {/* Soft polished studio floor below the rail — grounds the floating
            objects with gentle reflections. High tier only (extra render pass). */}
        {useFloor && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, -58]} receiveShadow>
            <planeGeometry args={[80, 220]} />
            <MeshReflectorMaterial
              resolution={1024}
              mixBlur={1}
              blur={[500, 120]}
              mixStrength={0.35}
              roughness={0.92}
              depthScale={1}
              minDepthThreshold={0.85}
              maxDepthThreshold={1.2}
              color="#d3dbe8"
              metalness={0.2}
              mirror={0}
            />
          </mesh>
        )}

        <Effects quality={quality} />
      </Suspense>

      <CameraRig />
    </Canvas>
  );
}
