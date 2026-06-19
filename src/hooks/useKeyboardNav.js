import { useEffect } from "react";
import { useSceneStore } from "@/store/useSceneStore";
import { NUM_CHECKPOINTS } from "@/config/checkpoints";

// Keyboard navigation: ArrowDown/Space -> next, ArrowUp -> prev, number keys -> jump.
export function useKeyboardNav() {
  const requestJump = useSceneStore((s) => s.requestJump);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const active = useSceneStore.getState().activeIndex;

      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        requestJump(Math.min(NUM_CHECKPOINTS - 1, active + 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        requestJump(Math.max(0, active - 1));
      } else if (/^[0-9]$/.test(e.key)) {
        // 1-9 -> checkpoints 0-8, 0 -> checkpoint 9
        const n = parseInt(e.key, 10);
        const idx = n === 0 ? 9 : n - 1;
        if (idx < NUM_CHECKPOINTS) requestJump(idx);
      } else if (e.key === "Home") {
        requestJump(0);
      } else if (e.key === "End") {
        requestJump(NUM_CHECKPOINTS - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestJump]);
}
