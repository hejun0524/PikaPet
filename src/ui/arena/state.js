// arena/state.js — ALL mutable state of the Arena view (UI-only for now).
// The Arena is 大乐斗-style asynchronous pet fighting: battles run locally
// against snapshots ("fight cards"), so nothing here needs a server. Planned
// persistence (win/loss record, saved rivals) will get its own save key —
// see the roadmap in arenaPageHTML.js.

/**
 * UI-only Arena state, reset on every hub launch.
 * - `rival`: the current opponent's fight card (a sparring dummy from
 *   makeRival, or a friend's card pasted as a fight code).
 * - `lastResult`: the most recent battle result (null until the engine
 *   lands — simulateBattle is still a stub).
 */
export const arenaUi = {
  rival: null,
  lastResult: null,
};
