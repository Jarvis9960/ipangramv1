import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import DesktopNav from "@/components/navigation/DesktopNav";
import MobileNav from "@/components/navigation/MobileNav";

export default function SiteHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome, pathname]);

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 left-0 right-0 z-[60] transition-colors duration-300 ${
        scrolled || !isHome
          ? "bg-[rgba(255,255,255,0.8)] backdrop-blur-[12px] border-b border-[rgba(16,32,58,0.1)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[68px] flex items-center justify-between">
        <Link
          to="/"
          data-testid="site-header-logo"
          className="text-[16px] font-bold tracking-[-0.03em] text-[#10203A]"
        >
          IPangram<span className="text-[#1A9C88]">.ai</span>
        </Link>

        <DesktopNav />

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/contact"
            data-testid="site-header-get-assessment-button"
            className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5B6A85] hover:text-[#10203A] transition-colors"
          >
            Get Assessment
          </Link>
          <Link
            to="/contact"
            data-testid="site-header-book-session-button"
            className="bg-[#1A9C88] text-white text-[13px] font-semibold rounded-[10px] px-4 py-2 hover:bg-[#137A6B] hover:shadow-[0_10px_30px_-8px_rgba(26,156,136,0.5)] transition-[background,box-shadow]"
          >
            Book Strategy Session
          </Link>
        </div>

        <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
      </div>
    </header>
  );
}
