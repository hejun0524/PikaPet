// tasks/taskDesc.js

import { t } from "../shared/i18n.js";
import { itemName } from "../shared/names.js";
import { ALL_ITEMS } from "../items.js";

/**
 * Localized description of a task (a pool entry or BONUS_TASK), resolving an
 * `itemKey` param (if any) through the item catalog's localized name.
 *
 * @param {object} task - A pool entry from findTask(), or BONUS_TASK.
 * @returns {string} Localized task description.
 */
export function taskDesc(task) {
  const params = { ...task.params };
  if (params.itemKey) {
    const item = ALL_ITEMS.find((i) => i.key === params.itemKey);
    params.item = item ? itemName(item) : params.itemKey;
  }
  return t(`dune.task.${task.template}`, params);
}
