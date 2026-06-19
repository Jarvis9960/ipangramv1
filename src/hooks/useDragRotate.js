import { useEffect } from "react";
import { useSceneStore } from "@/store/useSceneStore";

// Click-hold + drag anywhere on the 3D stage to orbit the focused object.
// Ignores the data panel, header and any interactive UI so scrolling, jumping
// and object selection keep working. Desktop only (touch keeps native scroll).
const UI_SELECTOR =
  'header, [data-testid="right-data-panel"], [data-no-drag], button, a, input, textarea, select, [role="button"]';

export function useDragRotate() {
  useEffect(() => {
    if (useSceneStore.getState().isMobile) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let tx = 0; // accumulated yaw target
    let ty = 0; // accumulated pitch target

    const MAX_YAW = 0.6; // ~34deg
    const MAX_PITCH = 0.32; // ~18deg
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));

    const isUI = (el) => !!(el && el.closest && el.closest(UI_SELECTOR));

    const onDown = (e) => {
      if (e.button !== 0 || isUI(e.target)) return;
      dragging = true;
      tx = 0;
      ty = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      useSceneStore.getState().setDragInput(0, 0);
      useSceneStore.getState().setDragging(true);
      document.body.classList.add("is-dragging");
    };

    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      tx = clamp(tx + dx * 0.005, MAX_YAW);
      ty = clamp(ty + dy * 0.004, MAX_PITCH);
      useSceneStore.getState().setDragInput(tx, ty);
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      useSceneStore.getState().setDragging(false);
      document.body.classList.remove("is-dragging");
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onUp);

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      document.body.classList.remove("is-dragging");
    };
  }, []);
}
