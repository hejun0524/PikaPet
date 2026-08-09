// hub/jobCardHTML.js

import { t } from "../shared/i18n.js";
import { jobName } from "../shared/names.js";
import { isJobUnlocked, jobRequirementText } from "../career.js";
import { unlockCtx } from "./unlockCtx.js";
import { activityLocked } from "./activityLocked.js";
import { drainText } from "./drainText.js";

/**
 * Card HTML for a job: a locked card with the requirement text, or a
 * stageable card (click to add to the plan book).
 *
 * @param {Object} job - Job definition from JOB_CATALOG.
 * @returns {string} Card HTML with a data-plan-job hook when unlocked.
 */
export function jobCardHTML(job) {
  if (!isJobUnlocked(job, unlockCtx())) {
    return `
    <div class="item locked">
      <span class="qty lock">🔒</span>
      <span class="icon">${job.emoji}</span>
      <span class="name">${jobName(job)}</span>
      <span class="effects">${t("job.rank", { n: job.rank })}</span>
      <span class="effects">${jobRequirementText(job)}</span>
    </div>`;
  }
  return `
    <div class="item ${activityLocked()}" data-plan-job="${job.key}">
      <span class="qty pay">+💰${job.pay}</span>
      <span class="icon">${job.emoji}</span>
      <span class="name">${jobName(job)}</span>
      <span class="effects">${t("job.line", { n: job.rank, m: job.minutes, xp: job.xp })}</span>
      <span class="effects">${drainText(job.drain)}</span>
    </div>`;
}
