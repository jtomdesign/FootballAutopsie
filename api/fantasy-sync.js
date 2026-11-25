/**
 * Fantasy gameweek sync + points engine.
 *
 * Serverless endpoint (Vercel). Pulls player stats for fixtures belonging to
 * the active fantasy gameweek from API-Football, computes fantasy points with
 * the scoring rules stored in Supabase, and writes:
 *   - fantasy_player_stats  (per player per fixture)
 *   - fantasy_manager_points (per team per gameweek, incl. ranks)
 *   - fantasy_teams.total_points
 *
 * Auth: requires header `x-fantasy-key: <FANTASY_SYNC_KEY>` or ?key=...
 * Env (server-side):
 *   FANTASY_SYNC_KEY       — shared secret (required)
 *   SUPABASE_URL           — falls back to VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — required for writes
 *   FOOTBALL_API_KEY       — required
 *
 * Schedule via Vercel Cron: e.g. every 15 min on matchdays.
 */

import { computePlayerPoints, computeGameweekPoints } from "../src/services/fantasyScoring.js";

const API_HOST = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";
const API_KEY = process.env.FOOTBALL_API_KEY ?? process.env.VITE_FOOTBALL_API_KEY;
const SB_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer ?? "return=minimal",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function apiFetch(params) {
  const qs = new URLSearchParams(params).toString();
  // One retry on throttle
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://${API_HOST}${qs}`, {
      headers: { "x-apisports-key": API_KEY },
    });
    if (res.status === 429 || res.status === 403) {
      await new Promise(r => setTimeout(r, 1200));
      continue;
    }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }
  throw new Error("API throttled");
}

const POS_MAP = { Goalkeeper: "G", Defender: "D", Midfielder: "M", Forward: "F", Attacker: "F" };

function extractStats(teamPlayers) {
  // API-Football /fixtures/players returns per-team player stat lines
  const out = [];
  for (const team of teamPlayers ?? []) {
    for (const p of team.players ?? []) {
      const s = p.statistics?.[0] ?? {};
      const g = s.games ?? {};
      out.push({
        api_player_id: p.player?.id,
        name: p.player?.name,
        minutes: g.minutes ?? 0,
        goals: g.goals?.total ?? 0,
        assists: s.goals?.assists ?? 0,
        yellow: s.cards?.yellow ?? 0,
        red: s.cards?.red ?? 0,
        position: POS_MAP[s.games?.position] ?? "M",
      });
    }
  }
  return out;
}

export default async function handler(req, res) {
  const key = req.query.key ?? req.headers["x-fantasy-key"];
  let authorized =
    !!process.env.FANTASY_SYNC_KEY && key === process.env.FANTASY_SYNC_KEY;

  // Or: a logged-in admin's Supabase JWT (for the dashboard "Sync" button)
  if (!authorized) {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token && SB_URL && SB_KEY) {
      try {
        const ures = await fetch(`${SB_URL}/auth/v1/user`, {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` },
        });
        const u = await ures.json();
        if (u?.id) {
          const adm = await sb(`rpc/fantasy_is_admin`, {
            method: "POST",
            body: JSON.stringify({ p_uid: u.id }),
          });
          authorized = adm === true;
        }
      } catch { /* fallthrough */ }
    }
  }
  if (!authorized) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!SB_KEY || !API_KEY) {
    return res.status(500).json({ error: "missing env" });
  }

  try {
    // 1. Active gameweeks (status open/live/deadline_passed)
    const gws = await sb(
      "fantasy_gameweeks?status=in.(open,live,deadline_passed)&select=id,season_id,number,fixture_ids",
    );
    if (!gws?.length) return res.json({ ok: true, processed: 0, reason: "no active gw" });

    const rulesRow = await sb("fantasy_scoring_rules?id=eq.1&select=rules");
    const rules = rulesRow?.[0]?.rules;
    if (!rules) return res.status(500).json({ error: "no scoring rules" });

    // 2. Player lookup: api_player_id -> fantasy_players.id
    const allPlayers = await sb(
      "fantasy_players?select=id,api_player_id,position&enabled=eq.true",
    );
    const byApiId = new Map(allPlayers.map(p => [p.api_player_id, p]));

    let fixturesProcessed = 0;
    const fixturePoints = new Map(); // fixture_id -> [{api_player_id, stats}]

    // 3. For each gw, pull player stats for its fixtures
    for (const gw of gws) {
      const fixtureIds = (gw.fixture_ids ?? []).filter(Boolean);
      for (const fid of fixtureIds) {
        const json = await apiFetch({ path: `/fixtures/players?fixture=${fid}` });
        const rows = extractStats(json?.response);
        for (const r of rows) {
          const fp = byApiId.get(r.api_player_id);
          if (!fp) continue;
          fixturePoints.set(`${fid}:${fp.id}`, { fp, stats: r });
        }
        fixturesProcessed++;
      }
    }

    // 4. Compute clean-sheet + conceded context per fixture
    //    (needs team goals — fetch fixture details)
    const fixtureMeta = new Map();
    const allFixtureIds = [...new Set(gws.flatMap(g => g.fixture_ids ?? []))];
    for (const fid of allFixtureIds) {
      const json = await apiFetch({ path: `/fixtures?id=${fid}` });
      const f = json?.response?.[0];
      if (!f) continue;
      const home = f.teams?.home, away = f.teams?.away;
      const hg = f.goals?.home ?? 0, ag = f.goals?.away ?? 0;
      fixtureMeta.set(fid, {
        homeId: home?.id, awayId: away?.id, hg, ag,
        homeCS: hg === 0 && ag > 0 ? false : hg <= ag, // placeholder, refined below
      });
    }

    // 5. Upsert player stats + points
    const statRows = [];
    for (const [key, { fp, stats }] of fixturePoints) {
      const [fid] = key.split(":");
      const meta = fixtureMeta.get(Number(fid));
      // Determine conceded/clean sheet by matching club — we stored club_api_id
      // on fantasy_players; need it here, so re-select
      statRows.push({ fp, stats, fid: Number(fid), meta });
    }

    // Need club_api_id for conceded calc — fetch players again with club
    const playersFull = await sb(
      "fantasy_players?select=id,api_player_id,position,club_api_id&enabled=eq.true",
    );
    const clubById = new Map(playersFull.map(p => [p.id, p.club_api_id]));

    const upserts = [];
    const pointsByPlayerGw = new Map(); // `${player_id}:${season_id}:${gw}` -> pts

    for (const gw of gws) {
      const fidSet = new Set((gw.fixture_ids ?? []).map(Number));
      for (const { fp, stats, fid, meta } of statRows) {
        if (!fidSet.has(fid)) continue;
        const clubApi = clubById.get(fp.id);
        const isHome = meta?.homeId === clubApi;
        const conceded = meta
          ? isHome ? meta.ag : meta.hg
          : 0;
        const cleanSheet = meta ? conceded === 0 : false;
        const full = { ...stats, conceded, clean_sheet: cleanSheet };
        const { points } = computePlayerPoints(full, fp.position, rules);
        upserts.push({
          player_id: fp.id,
          season_id: gw.season_id,
          gw: gw.number,
          fixture_id: fid,
          minutes: full.minutes, goals: full.goals, assists: full.assists,
          yellow: full.yellow, red: full.red,
          clean_sheet: cleanSheet, saves: full.saves ?? 0,
          penalty_saves: full.penalty_saves ?? 0,
          penalty_missed: full.penalty_missed ?? 0,
          own_goals: full.own_goals ?? 0, conceded,
          points, status: "provisional",
        });
        const k = `${fp.id}:${gw.season_id}:${gw.number}`;
        pointsByPlayerGw.set(k, (pointsByPlayerGw.get(k) ?? 0) + points);
      }
    }

    // Upsert in chunks
    for (let i = 0; i < upserts.length; i += 200) {
      await sb("fantasy_player_stats?on_conflict=player_id,season_id,fixture_id", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: JSON.stringify(upserts.slice(i, i + 200)),
      });
    }

    // 6. Manager gameweek points via lineup + stats
    const teams = await sb(
      "fantasy_teams?select=id,season_id,user_id&season_id=in.(" +
        [...new Set(gws.map(g => g.season_id))].join(",") + ")",
    );

    const managerRows = [];
    for (const gw of gws) {
      const gwTeams = teams.filter(t => t.season_id === gw.season_id);
      if (!gwTeams.length) continue;
      const teamIds = gwTeams.map(t => t.id);
      const [lineups, squadRows] = await Promise.all([
        sb(`fantasy_lineups?gw=eq.${gw.number}&team_id=in.(${teamIds.join(",")})&select=*`),
        sb(`fantasy_team_players?team_id=in.(${teamIds.join(",")})&select=team_id,player_id,fantasy_players(position)`),
      ]);
      const lineupsByTeam = new Map();
      for (const l of lineups ?? []) {
        if (!lineupsByTeam.has(l.team_id)) lineupsByTeam.set(l.team_id, []);
        lineupsByTeam.get(l.team_id).push(l);
      }
      const posByPlayer = new Map();
      for (const s of squadRows ?? []) posByPlayer.set(s.player_id, s.fantasy_players?.position);
      // stats per player for this gw
      const statPts = new Map();
      for (const [k, pts] of pointsByPlayerGw) {
        const [pid, , gwn] = k.split(":");
        if (Number(gwn) === gw.number) statPts.set(Number(pid), pts);
      }

      for (const t of gwTeams) {
        const lu = lineupsByTeam.get(t.id) ?? [];
        if (!lu.length) continue;
        const lineup = lu.map(l => ({
          player_id: l.player_id,
          position: posByPlayer.get(l.player_id) ?? "M",
          is_captain: l.is_captain,
          is_vc: l.is_vc,
          slot: l.slot,
          bench_order: l.bench_order,
          stats: { minutes: statPts.has(l.player_id) ? 1 : 0, _pts: statPts.get(l.player_id) ?? 0 },
        }));
        // computeGameweekPoints uses stats.minutes for "played" — but we need raw
        // points not recomputed. Simpler: aggregate directly.
        let total = 0;
        const cap = lu.find(l => l.is_captain);
        const vc = lu.find(l => l.is_vc);
        const eff = new Map();
        for (const l of lu) {
          const pts = statPts.get(l.player_id) ?? 0;
          if (l.slot === "bench") continue;
          eff.set(l.player_id, pts);
        }
        // bench auto-sub: bench players with points replace zero-point starters (order)
        const starters = lu.filter(l => l.slot !== "bench");
        const bench = lu.filter(l => l.slot === "bench")
          .sort((a, b) => (a.bench_order ?? 99) - (b.bench_order ?? 99));
        for (const s of starters) {
          if ((statPts.get(s.player_id) ?? 0) === 0) {
            const sub = bench.find(b => !eff.has(b.player_id) && (statPts.get(b.player_id) ?? 0) > 0);
            if (sub) { eff.delete(s.player_id); eff.set(sub.player_id, statPts.get(sub.player_id)); }
          }
        }
        for (const [, pts] of eff) total += pts;
        // captain multiplier on already-computed player points
        const capPts = cap ? (statPts.get(cap.player_id) ?? 0) : 0;
        const vcPts = vc ? (statPts.get(vc.player_id) ?? 0) : 0;
        const capEffective = capPts > 0 ? cap.player_id : (vcPts > 0 ? vc.player_id : null);
        if (capEffective && eff.has(capEffective)) {
          total += eff.get(capEffective) * (rules.captain_multiplier ?? 2 - 1);
        }
        managerRows.push({ team_id: t.id, season_id: gw.season_id, gw: gw.number, points: total });
      }
    }

    // Upsert manager points
    for (let i = 0; i < managerRows.length; i += 200) {
      await sb("fantasy_manager_points?on_conflict=team_id,season_id,gw", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: JSON.stringify(managerRows.slice(i, i + 200)),
      });
    }

    // 7. Update team totals + ranks (per season)
    for (const seasonId of [...new Set(gws.map(g => g.season_id))]) {
      await sb(`rpc/fantasy_refresh_rankings`, {
        method: "POST",
        body: JSON.stringify({ p_season_id: seasonId }),
      }).catch(() => null);
    }

    // 8. Credit free transfers for new gameweeks (1 per GW, cap = max_saved)
    for (const gw of gws) {
      const season = await sb(
        `fantasy_seasons?id=eq.${gw.season_id}&select=max_saved_transfers`,
      ).catch(() => null);
      const cap = season?.[0]?.max_saved_transfers ?? 5;
      await sb("rpc/fantasy_credit_free_transfers", {
        method: "POST",
        body: JSON.stringify({
          p_season_id: gw.season_id, p_gw: gw.number, p_cap: cap,
        }),
      }).catch(() => null);
    }

    // 9. Notify managers of their gameweek points
    const notifRows = managerRows.map(r => {
      const team = teams.find(t => t.id === r.team_id);
      return team?.user_id ? {
        user_id: team.user_id,
        type: "fantasy_points",
        title: `Fantasy GW${r.gw} : ${r.points} points`,
        message: `Votre équipe a marqué ${r.points} points sur la journée ${r.gw}.`,
        target_url: "/fantasy/points",
      } : null;
    }).filter(Boolean);
    for (let i = 0; i < notifRows.length; i += 200) {
      await sb("notifications", {
        method: "POST",
        body: JSON.stringify(notifRows.slice(i, i + 200)),
      }).catch(() => null);
    }

    // 9. Check achievements for all teams in active seasons
    for (const t of teams) {
      await sb("rpc/fantasy_check_achievements", {
        method: "POST",
        body: JSON.stringify({ p_team_id: t.id }),
      }).catch(() => null);
    }

    // 10. Fill H2H fixture scores for these gameweeks
    for (const gw of gws) {
      const leagues = await sb(
        `fantasy_leagues?season_id=eq.${gw.season_id}&type=eq.h2h&select=id`,
      ).catch(() => null);
      const leagueIds = (leagues ?? []).map(l => l.id);
      if (!leagueIds.length) continue;
      const h2h = await sb(
        `fantasy_h2h_fixtures?gw=eq.${gw.number}&league_id=in.(${leagueIds.join(",")})&select=id,home_team_id,away_team_id`,
      ).catch(() => null);
      for (const f of h2h ?? []) {
        const [hp, ap] = await Promise.all([
          sb(`fantasy_manager_points?team_id=eq.${f.home_team_id}&season_id=eq.${gw.season_id}&gw=eq.${gw.number}&select=points`),
          sb(`fantasy_manager_points?team_id=eq.${f.away_team_id}&season_id=eq.${gw.season_id}&gw=eq.${gw.number}&select=points`),
        ]);
        const hPts = hp?.[0]?.points, aPts = ap?.[0]?.points;
        if (hPts == null || aPts == null) continue;
        await sb(`fantasy_h2h_fixtures?id=eq.${f.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            home_points: hPts, away_points: aPts,
            status: "completed",
          }),
        });
      }
    }

    return res.json({
      ok: true,
      fixturesProcessed,
      statRows: upserts.length,
      managerRows: managerRows.length,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
