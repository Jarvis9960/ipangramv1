import { useEffect } from "react";
import "@/App.css";
import SceneCanvas from "@/three/SceneCanvas";
import StaticScene from "@/three/StaticScene";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import IntroSequence from "@/components/intro/IntroSequence";
import ProgressDots from "@/components/ProgressDots";
import CustomCursor from "@/components/CustomCursor";
import ObjectTooltip from "@/components/ObjectTooltip";
import LoadingScreen from "@/components/LoadingScreen";
import DataPanelHost from "@/components/panels/DataPanelHost";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { useScrollSnap } from "@/hooks/useScrollSnap";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useQualityTier } from "@/hooks/useQualityTier";
import { useDragRotate } from "@/hooks/useDragRotate";
import { useSceneStore } from "@/store/useSceneStore";
import { NUM_CHECKPOINTS } from "@/config/checkpoints";
import { PANELS, PANEL_ORDER } from "@/config/panelData";

function App() {
  useQualityTier();
  useLenisScroll();
  useScrollSnap();
  useKeyboardNav();
  useDragRotate();
  const setPointer = useSceneStore((s) => s.setPointer);
  const hasWebGL = useSceneStore((s) => s.hasWebGL);
  // The live 3D scene shows whenever WebGL is available. The CSS static scene is
  // only a last-resort fallback for browsers with no WebGL support at all.
  const showCanvas = hasWebGL;

  // Note: the "always open at the top" scroll reset (disabling native scroll
  // restoration + scrollTo(0,0)) lives in useLenisScroll, where it runs *before*
  // Lenis is created — otherwise Lenis adopts the restored scroll position and
  // glides straight past the intro into the hero on refresh.

  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      setPointer(x, y);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [setPointer]);

  return (
    <div className="app-root">
      {/* Cinematic frame-sequence intro — owns the first scroll band, then slides
          away to reveal the hero + 3D journey below. */}
      <IntroSequence />

      {/* Accessible semantic content for screen readers / SEO */}
      <div className="sr-only">
        <h1>IPangram.ai — Intelligent Business Systems. Build. Automate. Scale.</h1>
        {PANEL_ORDER.map((k) => {
          const p = PANELS[k];
          return (
            <section key={k} aria-label={p.title}>
              <h2>{p.title}</h2>
              {p.body && <p>{p.body}</p>}
            </section>
          );
        })}
      </div>

      {/* Fixed full-screen scene: live 3D on GPU browsers, static fallback otherwise */}
      <div className="canvas-layer">{showCanvas ? <SceneCanvas /> : <StaticScene />}</div>

      {/* Ambient brand-tinted aurora drifting over the scene (premium idle motion) */}
      <div className="ambient-bg" aria-hidden="true" />

      {/* UI overlay */}
      <LoadingScreen />
      <Header />
      <Hero />
      <ProgressDots />
      <ObjectTooltip />
      <CustomCursor />
      <DataPanelHost />

      {/* Scroll spacer drives the scroll-linked camera journey */}
      <div style={{ height: `${NUM_CHECKPOINTS * 100}vh`, pointerEvents: "none" }} aria-hidden="true" />
    </div>
  );
}

export default App;
