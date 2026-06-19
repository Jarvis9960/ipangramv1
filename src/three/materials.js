// Shared PBR material presets + a procedurally-generated micro-surface detail
// map. The detail map (subtle normal + roughness variation) keeps large flat
// faces from reading dead-flat under the HDRI environment, adding a sense of
// tangible, imperfect surfaces. Generated once and reused across every object.
//
// Presets return plain, serializable prop objects meant to be spread onto an
// r3f <meshPhysicalMaterial {...preset(...)} />. On the "low" quality tier they
// degrade to flat props (no clearcoat / no maps) to preserve the original look
// and performance.
import * as THREE from "three";

let _detail = null;

// --- multi-octave value noise -> Float32 heightfield in [0,1] -----------------
function valueNoise(size, octaves) {
  const out = new Float32Array(size * size);
  let amp = 1;
  let totalAmp = 0;
  for (let o = 0; o < octaves; o++) {
    const grid = 4 << o; // 4, 8, 16, 32...
    const gw = grid + 1;
    const g = new Float32Array(gw * gw);
    for (let i = 0; i < g.length; i++) g[i] = Math.random();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * grid;
        const gy = (y / size) * grid;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const sx = fx * fx * (3 - 2 * fx); // smoothstep
        const sy = fy * fy * (3 - 2 * fy);
        const v00 = g[y0 * gw + x0];
        const v10 = g[y0 * gw + x0 + 1];
        const v01 = g[(y0 + 1) * gw + x0];
        const v11 = g[(y0 + 1) * gw + x0 + 1];
        const top = v00 + (v10 - v00) * sx;
        const bot = v01 + (v11 - v01) * sx;
        out[y * size + x] += (top + (bot - top) * sy) * amp;
      }
    }
    totalAmp += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= totalAmp;
  return out;
}

function makeCanvasTexture(size, fill) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  fill(img.data);
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 4;
  // normal/roughness data is linear, not color
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// Lazily build the shared detail maps (normalMap + roughnessMap). Safe no-op
// during SSR / when no DOM is available.
export function getDetailMaps() {
  if (_detail) return _detail;
  if (typeof document === "undefined") return { normalMap: null, roughnessMap: null };

  const size = 256;
  const height = valueNoise(size, 5);

  // Roughness map: gentle variation around ~0.92 so it only lightly modulates
  // the base roughness (map value multiplies material.roughness).
  const roughnessMap = makeCanvasTexture(size, (data) => {
    for (let i = 0; i < height.length; i++) {
      const v = (0.84 + height[i] * 0.16) * 255;
      const j = i * 4;
      data[j] = data[j + 1] = data[j + 2] = v;
      data[j + 3] = 255;
    }
  });

  // Normal map: Sobel-style gradient of the heightfield, low strength.
  const strength = 1.6;
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  const normalMap = makeCanvasTexture(size, (data) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
        const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
        const nz = 1.0;
        const len = Math.hypot(dx, dy, nz) || 1;
        const i = (y * size + x) * 4;
        data[i] = ((dx / len) * 0.5 + 0.5) * 255;
        data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
        data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
        data[i + 3] = 255;
      }
    }
  });

  _detail = { normalMap, roughnessMap };
  return _detail;
}

function withDetail(props, quality, normalStrength) {
  if (quality === "low") return props;
  const { normalMap, roughnessMap } = getDetailMaps();
  if (!normalMap) return props;
  return {
    ...props,
    normalMap,
    normalScale: [normalStrength, normalStrength],
    roughnessMap,
  };
}

// --- Presets ------------------------------------------------------------------
// All accept (color, { quality, ...overrides }). quality defaults to "high".

// Glossy painted / lacquered surface — cores, pillars, blocks, buildings.
export function lacquer(color, opts = {}) {
  const { quality = "high", ...o } = opts;
  const base = {
    color,
    roughness: o.roughness ?? 0.4,
    metalness: o.metalness ?? 0.0,
    envMapIntensity: o.envMapIntensity ?? 1.0,
    emissive: o.emissive ?? "#000000",
    emissiveIntensity: o.emissiveIntensity ?? 0,
  };
  if (quality !== "low") {
    base.clearcoat = o.clearcoat ?? 0.55;
    base.clearcoatRoughness = o.clearcoatRoughness ?? 0.3;
  }
  return withDetail(base, quality, o.normal ?? 0.2);
}

// Polished / brushed metal — gears, rings, copper traces, metallic accents.
export function metal(color, opts = {}) {
  const { quality = "high", ...o } = opts;
  const base = {
    color,
    roughness: o.roughness ?? 0.32,
    metalness: o.metalness ?? 0.92,
    envMapIntensity: o.envMapIntensity ?? 1.25,
    emissive: o.emissive ?? "#000000",
    emissiveIntensity: o.emissiveIntensity ?? 0,
  };
  return withDetail(base, quality, o.normal ?? 0.28);
}

// Matte structural substrate — PCB base, plinths, neutral bodies.
export function matte(color, opts = {}) {
  const { quality = "high", ...o } = opts;
  const base = {
    color,
    roughness: o.roughness ?? 0.62,
    metalness: o.metalness ?? 0.12,
    envMapIntensity: o.envMapIntensity ?? 0.7,
    emissive: o.emissive ?? "#000000",
    emissiveIntensity: o.emissiveIntensity ?? 0,
  };
  return withDetail(base, quality, o.normal ?? 0.35);
}

// Glassy / translucent — helix strands, waveform shells. Cheap fake-glass via
// high clearcoat + low roughness + slight transparency (no transmission pass).
export function glassy(color, opts = {}) {
  const { quality = "high", ...o } = opts;
  const base = {
    color,
    roughness: o.roughness ?? 0.12,
    metalness: o.metalness ?? 0.0,
    envMapIntensity: o.envMapIntensity ?? 1.4,
    transparent: o.transparent ?? true,
    opacity: o.opacity ?? 0.9,
    emissive: o.emissive ?? color,
    emissiveIntensity: o.emissiveIntensity ?? 0.05,
  };
  if (quality !== "low") {
    base.clearcoat = o.clearcoat ?? 1.0;
    base.clearcoatRoughness = o.clearcoatRoughness ?? 0.08;
  }
  return base;
}

// True refractive glass — props for drei's <MeshTransmissionMaterial>. Returns
// null on the "low" tier so callers fall back to the cheap glassy() preset.
// Uses transmissionSampler so multiple glass surfaces share ONE scene pass
// (cheap enough to use on several objects). Tune via opts.
export function transmissionProps(color, opts = {}) {
  const { quality = "high", ...o } = opts;
  if (quality === "low") return null;
  return {
    color,
    transmission: o.transmission ?? 1,
    transmissionSampler: true,
    thickness: o.thickness ?? 0.6,
    roughness: o.roughness ?? 0.1,
    ior: o.ior ?? 1.4,
    chromaticAberration: o.chromaticAberration ?? 0.05,
    anisotropicBlur: o.anisotropicBlur ?? 0.1,
    distortion: o.distortion ?? 0.1,
    distortionScale: o.distortionScale ?? 0.2,
    temporalDistortion: o.temporalDistortion ?? 0.1,
    clearcoat: o.clearcoat ?? 1,
    attenuationColor: o.attenuationColor ?? "#ffffff",
    attenuationDistance: o.attenuationDistance ?? 1.5,
    emissive: o.emissive ?? color,
    emissiveIntensity: o.emissiveIntensity ?? 0,
    envMapIntensity: o.envMapIntensity ?? 1.5,
  };
}
