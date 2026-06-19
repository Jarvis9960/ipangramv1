import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSceneStore } from "@/store/useSceneStore";
import { focusForIndex } from "@/config/checkpoints";

// Returns a ref whose .current smoothly tracks the object's focus factor (0..1).
export function useFocus(index) {
  const focus = useRef(0);
  useFrame((_, delta) => {
    const p = useSceneStore.getState().scrollProgress;
    const target = focusForIndex(p, index);
    const k = Math.min(1, delta * 3.5);
    focus.current += (target - focus.current) * k;
  });
  return focus;
}

// Pointer hover helpers that drive the global hovered-object id + cursor.
export function hoverProps(id) {
  return {
    onPointerOver: (e) => {
      e.stopPropagation();
      useSceneStore.getState().setHovered(id);
    },
    onPointerOut: (e) => {
      e.stopPropagation();
      useSceneStore.getState().setHovered(null);
    },
  };
}
