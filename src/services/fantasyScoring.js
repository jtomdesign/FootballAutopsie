// Fantasy points engine — pure functions.
// Input: raw player match stats + scoring rules (fantasy_scoring_rules.rules).
// Output: points breakdown. Server-side processing calls these via the
// fantasy_process_gameweek RPC path (see services/fantasyScoring.js usage in
// api/fantasy-sync or admin actions).

const posOf = p => p?.position ?? "M";

/**
 * Points for one player's match performance.
 * stats: { minutes, goals, assists, yellow, red, clean_sheet, saves,
 *          penalty_saves, penalty_missed, own_goals, conceded }
 */
export function computePlayerPoints(stats, position, rules) {
  const s = stats ?? {};
  const mins = Number(s.minutes ?? 0);
  const goals = Number(s.goals ?? 0);
  const assists = Number(s.assists ?? 0);
  const yellow = Number(s.yellow ?? 0);
  const red = Number(s.red ?? 0);
  const conceded = Number(s.conceded ?? 0);
  const saves = Number(s.saves ?? 0);
  const penSaves = Number(s.penalty_saves ?? 0);
  const penMiss = Number(s.penalty_missed ?? 0);
  const ownGoals = Number(s.own_goals ?? 0);
  const cleanSheet = !!s.clean_sheet;

  const breakdown = {};
  let pts = 0;
  const add = (k, v) => { breakdown[k] = v; pts += v; };

  if (mins > 0) {
    add("appearance", mins >= 60 ? rules.appear_60_plus : rules.appear_under_60);
  }
  if (goals > 0) add("goals", goals * (rules.goal?.[position] ?? 5));
  if (assists > 0) add("assists", assists * rules.assist);
  if (cleanSheet) add("clean_sheet", rules.clean_sheet?.[position] ?? 0);
  if (saves > 0 && rules.saves_per_point > 0) {
    add("saves", Math.floor(saves / rules.saves_per_point));
  }
  if (penSaves > 0) add("penalty_saves", penSaves * rules.penalty_save);
  if (penMiss > 0) add("penalty_missed", penMiss * rules.penalty_miss);
  if (yellow > 0) add("yellow", yellow * rules.yellow);
  if (red > 0) add("red", red * rules.red);
  if (ownGoals > 0) add("own_goals", ownGoals * rules.own_goal);

  const concededPositions = rules.conceded_positions ?? ["G", "D"];
  if (conceded > 0 && concededPositions.includes(position) && rules.conceded_per_point > 0) {
    add("conceded", -Math.floor(conceded / rules.conceded_per_point));
  }

  return { points: pts, breakdown };
}

/**
 * Gameweek points for a full lineup.
 * lineup: [{ player_id, position, is_captain, is_vc, slot ('bench' or not),
 *            auto_subbed, stats: {...}|null }]
 * captainEffective: resolved by caller (captain if played, else VC, else null)
 */
export function computeGameweekPoints(lineup, rules, opts = {}) {
  const played = p => (p.stats?.minutes ?? 0) > 0 || (p.stats?.goals ?? 0) > 0
    || (p.stats?.assists ?? 0) > 0;

  const starterIds = new Set(
    lineup.filter(l => l.slot !== "bench").map(l => l.player_id),
  );

  // Auto-substitution: bench players who played, in bench_order, replace
  // non-playing starters (GK first, then outfield respecting formation).
  const starters = lineup
    .filter(l => starterIds.has(l.player_id))
    .sort((a, b) => Number(!!played(b)) - Number(!!played(a)));
  const bench = lineup
    .filter(l => !starterIds.has(l.player_id))
    .sort((a, b) => (a.bench_order ?? 99) - (b.bench_order ?? 99));

  const effective = new Map(); // player_id -> { entry, isAuto }
  const usedBench = new Set();

  // First pass: starters who played keep their slot
  for (const s of starters) {
    if (played(s)) effective.set(s.player_id, { entry: s, isAuto: false });
  }

  // Second pass: fill empty starter slots from bench in order.
  // Prefer a same-position sub; otherwise any outfield player (GK only for GK).
  const emptySlots = starters.filter(s => !played(s));
  for (const slot of emptySlots) {
    const candidates = bench.filter(b =>
      !usedBench.has(b.player_id) && played(b) &&
      (slot.position === "G" ? b.position === "G" : b.position !== "G"),
    );
    const sub = candidates.find(b => b.position === slot.position) ?? candidates[0];
    if (!sub) continue;
    usedBench.add(sub.player_id);
    effective.set(sub.player_id, { entry: { ...sub, slot: slot.slot }, isAuto: true });
  }

  // Captains: captain counts only if he played (or was auto-subbed in);
  // otherwise VC takes over if he played.
  const capEntry = lineup.find(l => l.is_captain);
  const vcEntry = lineup.find(l => l.is_vc);
  let captainId = null;
  if (capEntry && effective.has(capEntry.player_id)) captainId = capEntry.player_id;
  else if (vcEntry && effective.has(vcEntry.player_id)) captainId = vcEntry.player_id;

  const rows = [];
  let total = 0;

  for (const [pid, { entry }] of effective) {
    const { points, breakdown } = computePlayerPoints(
      entry.stats, entry.position, rules,
    );
    const isCaptain = pid === captainId;
    const finalPts = isCaptain ? points * (rules.captain_multiplier ?? 2) : points;
    total += finalPts;
    rows.push({
      player_id: pid,
      position: entry.position,
      points: finalPts,
      raw_points: points,
      is_captain: isCaptain,
      auto_subbed: entry.isAuto ?? false,
      breakdown,
    });
  }

  return { total, players: rows, captainId };
}
