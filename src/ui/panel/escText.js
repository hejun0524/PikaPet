// panel/escText.js

/**
 * Escape a value for safe interpolation into an HTML template string
 * (element text or a double-quoted attribute).
 *
 * @param {*} text - Value to escape; coerced to a string first.
 * @returns {string} The string with `&`, `<`, and `"` replaced by their
 *   HTML entities.
 */
export function escText(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
