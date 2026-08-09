// career.js — master file for the shared career/job data + helpers, used by
// the stats window (which runs the activity clock) and the hub window (Job
// page UI).
//
// Each function lives in its own file under career/; this file only groups
// and re-exports them. Import from "./career.js" rather than reaching into
// the folder.

export {
  TIERS,
  CAREER_MAX_XP,
  JOB_RANK_TEMPLATE,
  DEFAULT_TRAIT_MINS,
  CAREERS,
  JOB_CATALOG,
} from "./career/careerData.js";
export { PAY_BOOST_TRAIT_CAP, payBoostPercent } from "./career/payBoost.js";
export { careerProgress } from "./career/careerProgress.js";
export { tiersCompleted } from "./career/tiersCompleted.js";
export { levelLabel } from "./career/levelLabel.js";
export { findJob } from "./career/findJob.js";
export { findCareer } from "./career/findCareer.js";
export { hasDegree } from "./career/hasDegree.js";
export { isJobUnlocked } from "./career/isJobUnlocked.js";
export { jobRequirementText } from "./career/jobRequirementText.js";
