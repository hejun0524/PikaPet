// arena/fightCode.js — fight codes: a fight card as a shareable string.
// This is the serverless friend system: paste a friend's code (sent over
// any chat app) and battle their pet's snapshot offline.

/**
 * Encode a fight card as a compact shareable code (base64 JSON, prefixed so
 * codes are recognizable and future-proof).
 *
 * @param {object} card - A fight card (fightCardFromPet / makeRival shape).
 * @returns {string} e.g. "PIKAFIGHT1.eyJ2IjoxLCJuYW1l..."
 */
export function fightCodeFromCard(card) {
  return "PIKAFIGHT1." + btoa(unescape(encodeURIComponent(JSON.stringify(card))));
}

/**
 * Decode a pasted fight code back into a fight card.
 *
 * @param {string} code - A string from fightCodeFromCard (whitespace ok).
 * @returns {object|null} The fight card, or null if the code is invalid.
 */
export function cardFromFightCode(code) {
  try {
    const [tag, body] = String(code).trim().split(".");
    if (tag !== "PIKAFIGHT1" || !body) return null;
    const card = JSON.parse(decodeURIComponent(escape(atob(body))));
    if (card?.v !== 1 || typeof card.name !== "string" || !(card.hp > 0)) return null;
    return card;
  } catch (_) {
    return null;
  }
}
