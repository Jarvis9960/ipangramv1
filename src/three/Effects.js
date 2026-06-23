import React from "react";
import {
  EffectComposer,
  N8AO,
  Bloom,
  ChromaticAberration,
  Noise,
  SMAA,
  Vignette,
  BrightnessContrast,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

// Tiered post-processing — tuned smoothness-first so it holds a steady framerate.
// Ambient occlusion (contact darkening) is the main realism cue and now runs at
// half resolution; the expensive Depth-of-Field pass was dropped. Bloom is
// HDR-only (threshold 1.0) so it never washes out the light background.
//
//   high : AO(halfRes) + bloom + tone + chroma + grain + grade/vignette + SMAA
//   mid  : bloom + tone + chroma + grain + grade/vignette + SMAA
//   low  : no composer at all (preserves the original flat look + perf)
export default function Effects({ quality }) {
  if (quality === "low") return null;
  const high = quality === "high";

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {high && (
        <N8AO aoRadius={1.1} intensity={1.15} distanceFalloff={1.0} halfRes color="#10203a" />
      )}
      {/* HDR-only bloom (threshold 1.0) so emissive accents glow without washing
          out the light ground — nudged slightly richer for a premium sheen. */}
      <Bloom intensity={0.62} luminanceThreshold={1.0} luminanceSmoothing={0.22} mipmapBlur radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <ChromaticAberration offset={[0.0008, 0.0008]} radialModulation={false} modulationOffset={0} />
      <Noise premultiply opacity={high ? 0.045 : 0.03} />
      <BrightnessContrast brightness={0.008} contrast={0.06} />
      <Vignette offset={0.32} darkness={0.4} eskil={false} />
      <SMAA />
    </EffectComposer>
  );
}
