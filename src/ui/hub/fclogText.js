// hub/fclogText.js — localizes one structured battle-log entry from the
// fight engine (see fightclub/engine.js for the entry shapes).

import { t } from "../shared/i18n.js";
import { findSkill, skillName } from "../fightclub.js";
import { escText as esc } from "../panel.js";

/**
 * Render a battle-log entry as display text.
 *
 * @param {object} e - Log entry {k, n, s, v, c, pt, ot}.
 * @returns {string} Localized line (already escaped).
 */
export function fclogText(e) {
  const skill = e.s ? findSkill(e.s) : null;
  const params = {
    n: esc(e.n ?? ""),
    v: e.v ?? 0,
    skill: skill ? `${skill.emoji} ${skillName(skill)}` : (e.s ?? ""),
    p: e.pt ?? "",
    o: e.ot ?? "",
  };
  const crit = e.c ? t("fclog.crit") : "";
  switch (e.k) {
    case "rps": return t("fclog.rps", params);
    case "first": return t("fclog.first", params);
    case "basic": return crit + t("fclog.basic", params);
    case "skill": return crit + t("fclog.skill", params);
    case "skillplain": return t("fclog.skillplain", params);
    case "heal": return t("fclog.heal", params);
    case "buffatk": return t("fclog.buffatk", params);
    case "buffdef": return t("fclog.buffdef", params);
    case "debuffatk": return t("fclog.debuffatk", params);
    case "debuffdef": return t("fclog.debuffdef", params);
    case "stun": return t("fclog.stun", params);
    case "stunned": return t("fclog.stunned", params);
    case "resist": return t("fclog.resist", params);
    case "dodge": return t("fclog.dodge", params);
    case "block": return t("fclog.block", params);
    case "parry": return t("fclog.parry", params);
    case "counter": return crit + t("fclog.counter", params);
    case "survive": return t("fclog.survive", params);
    case "again": return t("fclog.again", params);
    case "dbl": return t("fclog.dbl", params);
    case "ko": return t("fclog.ko", params);
    case "timeup": return t("fclog.timeup", params);
    case "win": return t("fclog.win", params);
    default: return "";
  }
}
