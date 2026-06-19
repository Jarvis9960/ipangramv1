import React from "react";
import { useParams } from "react-router-dom";
import { CHALLENGE_DATA } from "@/data/challenges";
import PageHero from "@/components/sections/PageHero";
import ProblemSection from "@/components/sections/ProblemSection";
import SignsGrid from "@/components/sections/SignsGrid";
import ApproachSection from "@/components/sections/ApproachSection";
import CapabilitiesGrid from "@/components/sections/CapabilitiesGrid";
import OutcomesGrid from "@/components/sections/OutcomesGrid";
import IndustriesStrip from "@/components/sections/IndustriesStrip";
import WhySection from "@/components/sections/WhySection";
import CTABanner from "@/components/sections/CTABanner";
import NotFound from "@/pages/NotFound";

export default function ChallengePage() {
  const { slug } = useParams();
  const data = CHALLENGE_DATA[slug];

  if (!data) return <NotFound />;

  return (
    <article data-testid={`challenge-page-${slug}`}>
      <PageHero {...data.hero} />
      <ProblemSection {...data.problem} />
      <SignsGrid {...data.signs} />
      <ApproachSection {...data.approach} />
      <CapabilitiesGrid {...data.capabilities} />
      <OutcomesGrid {...data.outcomes} />
      <IndustriesStrip {...data.industries} />
      <WhySection {...data.whyIpangram} />
      <CTABanner {...data.cta} />
    </article>
  );
}
