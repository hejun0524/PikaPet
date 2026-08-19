// hub/tasksPageHTML.js — Dune's Daily Tasks: today's 5 challenges (one per
// hidden difficulty tier) plus the implicit 6th "clear all 5" bonus task, as
// an achievements-style list. Completion is automatic; claiming a reward is
// a manual click (see stats/claimTask.js).

import { t } from "../shared/i18n.js";
import { escText as esc } from "../panel.js";
import { state } from "./state.js";
import { BONUS_TASK, TEMPLATE_EMOJI, findTask, rewardText, taskDesc } from "../tasks.js";

/**
 * The Dune's Daily Tasks page: a streak/lifetime-total header, one row per
 * today's 5 tasks, and a 6th row for the "clear all 5" bonus.
 *
 * @returns {string} Page HTML for the grid.
 */
export function tasksPageHTML() {
  const dune = state.dune;
  const header = `<div class="ach-section caretaker-title">${t("dune.streak", {
    streak: dune.streak,
  })} · ${t("dune.totalDone", { total: dune.totalCompleted })}</div>`;

  const rows = dune.tasks
    .map((entry, i) => {
      const task = findTask(entry.tier, entry.id);
      if (!task) return "";
      const have = Math.min(task.threshold, dune.progress[task.counterKey] ?? 0);
      return taskRowHTML(task, i, dune, `${have}/${task.threshold}`);
    })
    .join("");

  const bonusHave = dune.completed.slice(0, 5).filter(Boolean).length;
  const bonusRow = taskRowHTML(BONUS_TASK, 5, dune, `${bonusHave}/5`);

  return `<div class="ach-list">${header}${rows}${bonusRow}</div>`;
}

/** One task row: progress, a Claim button once done, or a claimed/greyed row. */
function taskRowHTML(task, i, dune, progressText) {
  const done = !!dune.completed[i];
  const claimed = !!dune.claimed[i];
  const emoji = TEMPLATE_EMOJI[task.template] ?? "🏜️";
  const label = `${esc(taskDesc(task))} — ${rewardText(task.reward)}`;
  const trailing = claimed
    ? `<span class="ach-date">${t("dune.claimed")}</span>`
    : done
      ? `<button data-claim-task="${i}">${t("dune.claim")}</button>`
      : `<span class="ach-date">${esc(progressText)}</span>`;
  return `
    <div class="ach ${done ? "earned" : ""} ${claimed ? "claimed" : ""}">
      <span class="ach-emoji">${emoji}</span>
      <span class="ach-label">${label}</span>
      ${trailing}
    </div>`;
}
