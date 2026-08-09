// school.js — master file for the shared school data + helpers, used by the
// stats window (which runs the activity clock) and the hub window (School
// page UI).
//
// Each function lives in its own file under school/; this file only groups
// and re-exports them. Import from "./school.js" rather than reaching into
// the folder.

export {
  SCHOOL_MINUTE_MS_NORMAL,
  SCHOOL_MINUTE_MS_DEV,
  SCHOOL_STAGES,
  TOTAL_SCHOOL_YEARS,
  SUBJECTS,
  CLASS_CATALOG,
  SUBJECT_TRAIT,
  HIGHER_ED,
} from "./school/schoolData.js";
export { STUDY_BOOST_TRAIT_CAP, studyBoostPercent } from "./school/studyBoost.js";
export { schoolMinuteMs } from "./school/schoolMinuteMs.js";
export { findClass } from "./school/findClass.js";
export { findSubject } from "./school/findSubject.js";
export { stageOfYears } from "./school/stageOfYears.js";
export { stageStartYears } from "./school/stageStartYears.js";
export { stageEndYears } from "./school/stageEndYears.js";
export { isClassUnlocked } from "./school/isClassUnlocked.js";
export { classUnlockText } from "./school/classUnlockText.js";
export { advanceSubject } from "./school/advanceSubject.js";
export { subjectStageLabel } from "./school/subjectStageLabel.js";
export { formatRemaining } from "./school/formatRemaining.js";
