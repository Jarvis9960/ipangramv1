import { useEffect } from "react";
import { useSceneStore } from "@/store/useSceneStore";
import { NUM_CHECKPOINTS } from "@/config/checkpoints";

// One gesture = one section. Converts each discrete wheel / trackpad / swipe
// into a single requestJump(active +/- 1). Free wheel scrolling is suppressed
// (preventDefault); the existing jump handler in useLenisScroll animates the
// glide. A short, non-extending cooldown means a deliberate scroll advances one
// section while sustained scrolling chains through (~one per cooldown).
const WHEEL_THRESHOLD = 10; // px of intent before a snap fires
const TOUCH_THRESHOLD = 40; // px of swipe before a snap fires
const COOLDOWN_MS = 600; // forgiving lock — does not extend on inertia

export function useScrollSnap() {
  const requestJump = useSceneStore((s) => s.requestJump);

  useEffect(() => {
    let locked = false;
    let lockTimer = null;

    const jump = (dir) => {
      const active = useSceneStore.getState().activeIndex;
      const next = Math.max(0, Math.min(NUM_CHECKPOINTS - 1, active + dir));
      if (next === active) return; // clamped at either end — no-op
      requestJump(next);
      locked = true;
      if (lockTimer) clearTimeout(lockTimer);
      lockTimer = setTimeout(() => {
        locked = false;
        lockTimer = null;
      }, COOLDOWN_MS);
    };

    // True when the wheel target is inside a panel that can still scroll in the
    // wheel's direction — let those events scroll the panel natively.
    const scrollableInDirection = (target, dy) => {
      const el = target && target.closest && target.closest("[data-lenis-prevent]");
      if (!el) return false;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight) return false;
      if (dy > 0) return scrollTop + clientHeight < scrollHeight - 1; // room down
      return scrollTop > 1; // room up
    };

    const onWheel = (e) => {
      // During the cinematic intro, let the wheel scroll freely so the frame
      // sequence scrubs continuously; snapping only owns the post-intro journey.
      if (!useSceneStore.getState().introDone) return;
      if (scrollableInDirection(e.target, e.deltaY)) return; // panel scroll
      e.preventDefault();
      if (locked || Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      jump(Math.sign(e.deltaY));
    };

    // --- Touch swipe (mobile) ---
    let touchStartY = null;
    let touchInPanel = false;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchStartY = t ? t.clientY : null;
      touchInPanel = !!(
        e.target &&
        e.target.closest &&
        e.target.closest("[data-lenis-prevent]")
      );
    };

    const onTouchEnd = (e) => {
      if (!useSceneStore.getState().introDone) return; // free scrub during intro
      if (touchStartY === null || touchInPanel) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dy = touchStartY - t.clientY; // swipe up (positive) -> next section
      touchStartY = null;
      if (locked || Math.abs(dy) < TOUCH_THRESHOLD) return;
      jump(Math.sign(dy));
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [requestJump]);
}
