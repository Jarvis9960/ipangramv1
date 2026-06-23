import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "@/components/navigation/navData";
import { useSceneStore } from "@/store/useSceneStore";

export default function DesktopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const requestJump = useSceneStore((s) => s.requestJump);

  const handleTopLevel = (item) => {
    if (isHome && item.homeIndex != null) {
      requestJump(item.homeIndex);
    } else if (item.href) {
      navigate(item.href);
    } else if (item.children) {
      navigate(item.children[0].href);
    }
  };

  return (
    <nav data-testid="site-header-nav" className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map((item) =>
        item.children ? (
          <div key={item.label} className="relative group">
            <button
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => handleTopLevel(item)}
              className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.12em] uppercase text-[#5B6A85] hover:text-[#10203A] transition-colors px-3 py-2 relative nav-link"
            >
              {item.label}
              <ChevronDown
                size={12}
                className="transition-transform duration-200 group-hover:rotate-180"
              />
            </button>
            <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-[rgba(255,255,255,0.95)] backdrop-blur-[16px] border border-[rgba(16,32,58,0.1)] rounded-xl shadow-[0_20px_50px_-16px_rgba(16,32,58,0.2)] py-2 min-w-[240px]">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    to={child.href}
                    data-testid={`nav-link-${child.href.split("/").pop()}`}
                    className="block px-4 py-2.5 text-[13px] text-[#5B6A85] hover:text-[#10203A] hover:bg-[rgba(0,212,255,0.06)] transition-colors"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            key={item.label}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => handleTopLevel(item)}
            className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5B6A85] hover:text-[#10203A] transition-colors px-3 py-2 relative nav-link"
          >
            {item.label}
          </button>
        ),
      )}
    </nav>
  );
}
