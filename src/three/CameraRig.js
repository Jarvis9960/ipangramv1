import React, { useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useSceneStore } from "@/store/useSceneStore";
import { sampleRail } from "@/config/checkpoints";

// Drives the camera along the narrative rail based on scroll progress.
// - Shifts the framed object into the free LEFT space (the right side is covered
//   by the data panel) using a projection view-offset on desktop.
// - Lets the user click-hold + drag to ORBIT the focused object, with a smooth
//   spring back to the cinematic framing on release.
export default function CameraRig() {
  const { camera, size } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));
  const basePos = useRef(new THREE.Vector3(0, 0, 8));
  const dragTarget = useRef({ x: 0, y: 0 });
  const dragCur = useRef({ x: 0, y: 0 });
  const view = useRef({ w: 0, h: 0, off: -1 });
  const sph = useRef(new THREE.Spherical());
  const offset = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const store = useSceneStore.getState();
    const progress = store.scrollProgress;
    const { cameraPos, lookAt } = sampleRail(progress);

    // Subtle parallax drift from pointer + a gentle autonomous float so the
    // scene feels alive even when the user is not scrolling. The float is
    // strongest at the hero and eases off into the journey.
    const ptr = store.pointer;
    const driftX = ptr.x * 0.18;
    const driftY = ptr.y * 0.14;
    const t = state.clock.elapsedTime;
    const heroWeight = 0.35 + 0.65 * (1 - Math.min(1, progress / 0.09));
    const swayX = store.reducedMotion ? 0 : Math.sin(t * 0.18) * 0.25 * heroWeight;
    const swayY = store.reducedMotion ? 0 : Math.cos(t * 0.13) * 0.18 * heroWeight;

    // Tighter smoothing than before so the camera tracks scroll closely
    // (responsive/smooth) instead of floating behind it (laggy).
    easing.damp3(
      basePos.current,
      [cameraPos[0] + driftX + swayX, cameraPos[1] + driftY + swayY, cameraPos[2]],
      0.28,
      delta
    );
    easing.damp3(lookTarget.current, [lookAt[0], lookAt[1], lookAt[2]], 0.26, delta);

    // --- Shift the object into the free left space (desktop only) ---
    // The hero beat (0) keeps the scene centred behind the editorial type; the
    // ramp reaches full by beat 1 (one beat span ≈ 1/11 ≈ 0.09) so the right
    // side is freed for the data panels once the journey begins.
    const mobile = store.isMobile;
    const heroRamp = Math.min(1, progress / 0.09);
    const fr = mobile ? 0 : 0.16 * heroRamp;
    const offX = Math.round(size.width * fr);
    if (view.current.w !== size.width || view.current.h !== size.height || view.current.off !== offX) {
      if (fr === 0) {
        if (camera.view && camera.view.enabled) camera.clearViewOffset();
      } else {
        camera.setViewOffset(size.width, size.height, offX, 0, size.width, size.height);
      }
      view.current = { w: size.width, h: size.height, off: offX };
    }

    // --- Drag-to-orbit around the focused object ---
    const dragging = store.dragging;
    const input = store.dragInput;
    if (dragging) {
      dragTarget.current.x = input.x;
      dragTarget.current.y = input.y;
    } else {
      // spring the framing back to neutral when released
      const kr = Math.min(1, delta * 2.4);
      dragTarget.current.x += (0 - dragTarget.current.x) * kr;
      dragTarget.current.y += (0 - dragTarget.current.y) * kr;
    }
    const kc = Math.min(1, delta * 9);
    dragCur.current.x += (dragTarget.current.x - dragCur.current.x) * kc;
    dragCur.current.y += (dragTarget.current.y - dragCur.current.y) * kc;

    // Build the final camera position by orbiting the base position around the
    // look target by the current drag angles (preserves distance/framing).
    offset.current.copy(basePos.current).sub(lookTarget.current);
    if (Math.abs(dragCur.current.x) > 1e-4 || Math.abs(dragCur.current.y) > 1e-4) {
      sph.current.setFromVector3(offset.current);
      sph.current.theta += dragCur.current.x;
      sph.current.phi = THREE.MathUtils.clamp(sph.current.phi - dragCur.current.y, 0.25, Math.PI - 0.25);
      offset.current.setFromSpherical(sph.current);
    }
    camera.position.copy(lookTarget.current).add(offset.current);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
