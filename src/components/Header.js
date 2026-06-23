import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useSceneStore } from "@/store/useSceneStore";

const NAV = [
  { label: "Systems", index: 4 },
  { label: "Challenges", index: 5 },
  { label: "Framework", index: 6 },
  { label: "Industries", index: 9 },
  { label: "How We Work", index: 10 },
];

export default function Header() {
  const requestJump = useSceneStore((s) => s.requestJump);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const introProgress = useSceneStore((s) => s.introProgress);
  const [open, setOpen] = useState(false);
  const scrolled = scrollProgress > 0.01;

  // Keep the header out of the way during the cinematic intro; fade it in as the
  // intro completes (introProgress is pinned at 1 in headless / no-WebGL contexts,
  // so it shows immediately there).
  const headerReveal = Math.min(1, Math.max(0, (introProgress - 0.88) / 0.12));

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  const go = (i) => {
    requestJump(i);
    setOpen(false);
  };

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 left-0 right-0 z-[60] transition-colors duration-300 ${
        scrolled ? "bg-[rgba(255,255,255,0.8)] backdrop-blur-[12px] border-b border-[rgba(16,32,58,0.1)]" : "bg-transparent"
      }`}
      style={{
        opacity: headerReveal,
        pointerEvents: headerReveal <= 0 ? "none" : undefined,
      }}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[68px] flex items-center justify-between">
        <button
          data-testid="site-header-logo"
          onClick={() => go(0)}
          className="text-[16px] font-bold tracking-[-0.03em] text-[#10203A] cursor-hover"
        >
          IPangram<span className="text-[#00D4FF]">.ai</span>
        </button>

        <nav data-testid="site-header-nav" className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            <button
              key={n.label}
              data-testid={`site-header-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => go(n.index)}
              className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5B6A85] hover:text-[#10203A] transition-colors cursor-hover relative nav-link"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            data-testid="site-header-get-assessment-button"
            onClick={() => go(0)}
            className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5B6A85] hover:text-[#10203A] transition-colors cursor-hover"
          >
            Get Assessment
          </button>
          <button
            data-testid="site-header-book-session-button"
            onClick={() => go(11)}
            className="bg-[#00D4FF] text-white text-[13px] font-semibold rounded-[10px] px-4 py-2 hover:bg-[#0891B2] hover:shadow-[0_10px_30px_-8px_rgba(0,212,255,0.5)] transition-[background,box-shadow] cursor-hover"
          >
            Book Strategy Session
          </button>
        </div>

        <button
          data-testid="site-header-mobile-menu-button"
          className="md:hidden text-[#10203A] p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          data-testid="mobile-menu-overlay"
          className="md:hidden fixed inset-0 top-[68px] z-[59] bg-[rgba(230,234,241,0.97)] backdrop-blur-[14px] flex flex-col gap-5 px-6 pt-8"
        >
          {NAV.map((n) => (
            <button
              key={n.label}
              data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => go(n.index)}
              className="text-left font-mono text-[14px] tracking-[0.12em] uppercase text-[#10203A] py-2 border-b border-[rgba(16,32,58,0.1)]"
            >
              {n.label}
            </button>
          ))}
          <button
            data-testid="mobile-book-session-button"
            onClick={() => go(11)}
            className="mt-3 bg-[#00D4FF] text-white text-[14px] font-semibold rounded-[10px] px-4 py-3"
          >
            Book Strategy Session
          </button>
        </div>
      )}
    </header>
  );
}
