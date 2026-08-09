// arena.js — master file for the Arena: 大乐斗-style asynchronous pet
// fighting. Each function lives in its own file under arena/; this module
// only groups and re-exports them. Import from "./arena.js" rather than
// reaching into arena/ directly.
//
// Battles are fought against fight-card SNAPSHOTS, never live opponents, so
// the whole feature works without a server: cards travel as pasteable fight
// codes, and the (upcoming) battle engine is deterministic so both sides
// can replay the identical fight. Status: cards, rivals, and fight codes
// work; simulateBattle is a stub and the Fight button is disabled.

// Mutable state (UI-only for now).
export { arenaUi } from "./arena/state.js";

// Fight cards: derivation, generated rivals, shareable codes.
export { fightCardFromPet } from "./arena/fightCardFromPet.js";
export { makeRival } from "./arena/makeRival.js";
export { fightCodeFromCard, cardFromFightCode } from "./arena/fightCode.js";

// The battle engine (stub — see file for the design constraints).
export { simulateBattle } from "./arena/simulateBattle.js";

// Rendering and click handling (delegated from the hub's #grid listener).
export { arenaPageHTML } from "./arena/arenaPageHTML.js";
export { arenaHandleClick } from "./arena/arenaHandleClick.js";
