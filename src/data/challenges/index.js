import { data as generateMoreLeads } from "./generateMoreLeads";
import { data as improveCustomerExperience } from "./improveCustomerExperience";
import { data as reduceManualWork } from "./reduceManualWork";
import { data as improveTeamProductivity } from "./improveTeamProductivity";
import { data as improveOperationalVisibility } from "./improveOperationalVisibility";
import { data as scaleWithoutComplexity } from "./scaleWithoutComplexity";

export const CHALLENGE_DATA = {
  "generate-more-leads": generateMoreLeads,
  "improve-customer-experience": improveCustomerExperience,
  "reduce-manual-work": reduceManualWork,
  "improve-team-productivity": improveTeamProductivity,
  "improve-operational-visibility": improveOperationalVisibility,
  "scale-without-growing-complexity": scaleWithoutComplexity,
};

export const CHALLENGE_LIST = Object.values(CHALLENGE_DATA);
