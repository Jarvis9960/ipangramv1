// Synchronous device/quality detection shared by the store (initial state)
// and the runtime hook, so the 3D canvas mounts with the right tier from the
// very first frame (avoids an expensive Bloom frame on low-end / headless).

export function detectRenderer() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { renderer: "none", hasWebGL: false };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";
    return { renderer: renderer.toLowerCase(), hasWebGL: true };
  } catch (e) {
    return { renderer: "", hasWebGL: false };
  }
}

export function computeTier() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { tier: "low", isMobile: false, reducedMotion: false, hasWebGL: true };
  }
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const mobile = window.innerWidth < 768 || coarse;

  const { renderer, hasWebGL } = detectRenderer();
  const isSoftware = /swiftshader|llvmpipe|software|microsoft basic|mesa offscreen/.test(renderer);
  const isHeadless = /headless/i.test(navigator.userAgent || "") || navigator.webdriver === true;

  let tier = "high";
  if (!hasWebGL || isSoftware || isHeadless || mobile || cores <= 4) tier = "low";
  else if (cores <= 8 || dpr < 1.5) tier = "mid";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Whether to mount the live WebGL canvas. Headless/no-GPU contexts get the
  // lightweight static scene so the page never stalls.
  const webglEnabled = hasWebGL && !isHeadless;
  return { tier, isMobile: mobile, reducedMotion, hasWebGL, headless: isHeadless, webglEnabled };
}
