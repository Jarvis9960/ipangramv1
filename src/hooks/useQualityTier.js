import { useEffect } from "react";
import { useSceneStore } from "@/store/useSceneStore";
import { computeTier } from "@/lib/deviceTier";

// Keeps quality tier / mobile / reduced-motion / webgl up to date with the env.
// Initial values are already computed synchronously in the store; this hook adds
// listeners for resize and reduced-motion changes.
export function useQualityTier() {
  const setQualityTier = useSceneStore((s) => s.setQualityTier);
  const setReducedMotion = useSceneStore((s) => s.setReducedMotion);
  const setIsMobile = useSceneStore((s) => s.setIsMobile);
  const setWebglEnabled = useSceneStore((s) => s.setWebglEnabled);
  const setHasWebGL = useSceneStore((s) => s.setHasWebGL);

  useEffect(() => {
    const sync = () => {
      const { tier, isMobile, reducedMotion, webglEnabled, hasWebGL } = computeTier();
      setQualityTier(tier);
      setIsMobile(isMobile);
      setReducedMotion(reducedMotion);
      setWebglEnabled(webglEnabled);
      setHasWebGL(hasWebGL);
    };
    sync();

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, [setQualityTier, setReducedMotion, setIsMobile, setWebglEnabled, setHasWebGL]);
}
