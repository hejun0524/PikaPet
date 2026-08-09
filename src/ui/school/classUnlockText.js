// school/classUnlockText.js

import { t, tOr } from "../shared/i18n.js";
import { SCHOOL_STAGES } from "./schoolData.js";
import { findSubject } from "./findSubject.js";

/**
 * Human-readable unlock requirement shown on a locked class card.
 *
 * @param {object} cls - Class entry from CLASS_CATALOG (`{ subject, stage }`
 *   are the fields used).
 * @returns {string} Text like "Reach Middle School in Math".
 */
export function classUnlockText(cls) {
  const stage = SCHOOL_STAGES.find((s) => s.key === cls.stage);
  const subject = findSubject(cls.subject);
  return t("school.unlock", {
    stage: tOr(`stage.${stage.key}`, stage.label),
    subject: tOr(`subject.${subject.key}`, subject.label),
  });
}
