import React from "react";
import { Outlet } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollToTop from "@/layouts/ScrollToTop";

export default function SubPageLayout() {
  return (
    <div className="min-h-screen bg-[var(--scene-bg)]">
      <ScrollToTop />
      <SiteHeader />
      <div className="ambient-bg" />
      <main className="pt-[68px]">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
