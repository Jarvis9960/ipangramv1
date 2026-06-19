import React, { useEffect, useRef } from "react";
import { useSceneStore } from "@/store/useSceneStore";

// Custom cursor: a teal dot with a trailing ring that expands over interactives.
export default function CustomCursor() {
  const isMobile = useSceneStore((s) => s.isMobile);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const dotRef = useRef();
  const ringRef = useRef();
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const hoverRef = useRef(false);

  useEffect(() => {
    if (isMobile) return;
    document.body.classList.add("hide-native-cursor");

    const onMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      const el = e.target;
      hoverRef.current = !!(el && el.closest && el.closest("button, a, [role=button], .cursor-hover, input, [data-cursor=hover]"));
    };
    window.addEventListener("pointermove", onMove);

    let raf;
    const loop = () => {
      const hovered3d = useSceneStore.getState().hovered;
      const dragging = useSceneStore.getState().dragging;
      const interactive = hoverRef.current || !!hovered3d || dragging;
      ring.current.x += (pos.current.x - ring.current.x) * (reducedMotion ? 1 : 0.18);
      ring.current.y += (pos.current.y - ring.current.y) * (reducedMotion ? 1 : 0.18);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      if (ringRef.current) {
        const size = dragging ? 52 : interactive ? 42 : 28;
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
        ringRef.current.style.borderColor = interactive ? "rgba(26,156,136,0.9)" : "rgba(26,156,136,0.42)";
        ringRef.current.style.background = dragging ? "rgba(26,156,136,0.14)" : interactive ? "rgba(26,156,136,0.08)" : "transparent";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("hide-native-cursor");
    };
  }, [isMobile, reducedMotion]);

  if (isMobile) return null;

  return (
    <div data-testid="custom-cursor" className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true">
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-[6px] h-[6px] rounded-full bg-[#1A9C88]"
        style={{ transform: "translate(-100px,-100px) translate(-50%,-50%)", marginLeft: -3, marginTop: -3 }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full border"
        style={{ width: 28, height: 28, borderColor: "rgba(26,156,136,0.42)", transition: "width 200ms cubic-bezier(0.22,1,0.36,1), height 200ms cubic-bezier(0.22,1,0.36,1), border-color 200ms ease, background 200ms ease" }}
      />
    </div>
  );
}
