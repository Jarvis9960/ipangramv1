import React from "react";
import { Link } from "react-router-dom";
import { FOOTER_LINKS } from "@/components/navigation/navData";

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#10203A] font-semibold mb-4">
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              to={link.href}
              className="text-[13.5px] text-[#5B6A85] hover:text-[#1A9C88] transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(16,32,58,0.08)] bg-[rgba(255,255,255,0.4)] backdrop-blur-[8px]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <FooterColumn title="Challenges" links={FOOTER_LINKS.challenges} />
          <FooterColumn title="Capabilities" links={FOOTER_LINKS.capabilities} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          <div>
            <FooterColumn title="Legal" links={FOOTER_LINKS.legal} />
            <div className="mt-8">
              <Link
                to="/"
                className="text-[16px] font-bold tracking-[-0.03em] text-[#10203A]"
              >
                IPangram<span className="text-[#1A9C88]">.ai</span>
              </Link>
              <p className="text-[12px] text-[#8492A8] mt-2">
                Intelligent Business Systems
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[rgba(16,32,58,0.08)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-[#8492A8]">
            &copy; {new Date().getFullYear()} IPangram. All rights reserved.
          </p>
          <p className="text-[12px] text-[#8492A8]">
            Build. Automate. Scale.
          </p>
        </div>
      </div>
    </footer>
  );
}
