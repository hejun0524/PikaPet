// touring/souvenirName.js

import { t, tOr } from "../shared/i18n.js";

/**
 * Display name of the souvenir brought home from a city, in the active
 * locale. The city/team name itself is localized too (via its "city.<name>"
 * locale entry, falling back to the English name).
 *
 * @param {string} city - City or team name the souvenir came from (English,
 *   as stored in saves).
 * @returns {string} Text like "Souvenir from Kyoto".
 */
export function souvenirName(city) {
  return t("tour.souvenir", { city: tOr(`city.${city}`, city) });
}
