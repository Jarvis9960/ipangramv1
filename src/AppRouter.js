import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import App from "@/App";
import SubPageLayout from "@/layouts/SubPageLayout";

const ChallengePage = lazy(() => import("@/pages/challenges/ChallengePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <p className="panel-eyebrow">Loading…</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route element={<SubPageLayout />}>
        <Route
          path="/challenges/:slug"
          element={
            <Suspense fallback={<PageFallback />}>
              <ChallengePage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
