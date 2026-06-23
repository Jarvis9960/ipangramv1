import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { NAV_ITEMS } from "@/components/navigation/navData";
import { useSceneStore } from "@/store/useSceneStore";

export default function MobileNav({ open, onOpenChange }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const requestJump = useSceneStore((s) => s.requestJump);

  const handleLink = (href, homeIndex) => {
    if (isHome && homeIndex != null) {
      requestJump(homeIndex);
    } else {
      navigate(href || "/");
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          data-testid="site-header-mobile-menu-button"
          className="md:hidden text-[#10203A] p-2"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-[rgba(230,234,241,0.97)] backdrop-blur-[14px] w-[300px] pt-10"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <Accordion type="single" collapsible className="w-full">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <AccordionItem
                key={item.label}
                value={item.label}
                className="border-[rgba(16,32,58,0.1)]"
              >
                <AccordionTrigger className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#10203A] hover:no-underline">
                  {item.label}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-1 pl-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={() => onOpenChange(false)}
                        className="text-[13px] text-[#5B6A85] hover:text-[#10203A] py-2 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ) : (
              <div
                key={item.label}
                className="border-b border-[rgba(16,32,58,0.1)]"
              >
                <button
                  onClick={() => handleLink(item.href, item.homeIndex)}
                  className="w-full text-left font-mono text-[13px] tracking-[0.12em] uppercase text-[#10203A] py-4"
                >
                  {item.label}
                </button>
              </div>
            ),
          )}
        </Accordion>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/contact"
            onClick={() => onOpenChange(false)}
            className="font-mono text-[12px] tracking-[0.12em] uppercase text-[#5B6A85] hover:text-[#10203A] transition-colors"
          >
            Get Assessment
          </Link>
          <Link
            to="/contact"
            onClick={() => onOpenChange(false)}
            className="bg-[#00D4FF] text-white text-[14px] font-semibold rounded-[10px] px-4 py-3 text-center hover:bg-[#0891B2] transition-colors"
          >
            Book Strategy Session
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
