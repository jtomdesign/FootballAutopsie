import { footballApi } from "./client";
import {
  normalizeFixture,
  normalizeLeague,
  normalizePlayer,
  normalizeStandingRow,
  normalizeTeam,
} from "./normalize";
import { getCurrentSeason } from "./leagues";

const toDateParam = d =>
  d.toLocaleDateString("en-CA", { timeZone: "UTC" }); // YYYY-MM-DD

export const todayParam = () => toDateParam(new Date());

export const shiftDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateParam(d);
};

// ---------- Leagues / Competitions ----------

export const getFeaturedLeagues = async () => {
  const res = await footballApi("/leagues", { current: true });
  return res.map(normalizeLeague);
};

export const searchLeagues = async ({ search, country, page = 1 }) => {
  // api-sports.io rejects `current` combined with `search`
  const res = await footballApi("/leagues", {
    search,
    country,
    current: search ? undefined : true,
    page,
  });
  return res.map(normalizeLeague);
};

export const getLeagueById = async id => {
  const res = await footballApi("/leagues", { id });
  if (!res.length) return null;
  return normalizeLeague(res[0]);
};

// ---------- Fixtures ----------

export const getFixturesByDate = async date => {
  const res = await footballApi("/fixtures", { date });
  return res.map(normalizeFixture);
};

export const getLiveFixtures = async () => {
  const res = await footballApi("/fixtures", { live: "all" });
  return res.map(normalizeFixture);
};

export const getFixturesByLeague = async ({ league, season, next = 10 }) => {
  const res = await footballApi("/fixtures", {
    league,
    season: season ?? getCurrentSeason(),
    next,
  });
  return res.map(normalizeFixture);
};

export const getFixture = async id => {
  const res = await footballApi("/fixtures", { id });
  if (!res.length) return null;
  return normalizeFixture(res[0]);
};

export const getTeamFixtures = async ({ team, season, last = 10, next = 10 }) => {
  const params = { team, season: season ?? getCurrentSeason() };
  const [past, upcoming] = await Promise.all([
    footballApi("/fixtures", { ...params, last }).catch(() => []),
    footballApi("/fixtures", { ...params, next }).catch(() => []),
  ]);
  return {
    last: past.map(normalizeFixture),
    next: upcoming.map(normalizeFixture),
  };
};

export const getLeagueFixtures = async ({
  league,
  season,
  last = 10,
  next = 10,
}) => {
  const params = { league, season: season ?? getCurrentSeason() };
  const [past, upcoming] = await Promise.all([
    footballApi("/fixtures", { ...params, last }).catch(() => []),
    footballApi("/fixtures", { ...params, next }).catch(() => []),
  ]);
  return {
    last: past.map(normalizeFixture),
    next: upcoming.map(normalizeFixture),
  };
};

// ---------- Standings ----------

export const getStandings = async ({ league, season }) => {
  const res = await footballApi("/standings", {
    league,
    season: season ?? getCurrentSeason(),
  });
  // api-sports.io returns standings as an array of groups; each group is
  // either { name, standings: [...] } or a bare array of rows.
  return (res?.[0]?.league?.standings ?? []).map((group, i) => {
    const rows = Array.isArray(group) ? group : group?.standings ?? [];
    const name = Array.isArray(group)
      ? rows[0]?.group ?? `Groupe ${i + 1}`
      : group?.name ?? "General";
    return { name, rows: rows.map(normalizeStandingRow) };
  });
};

// ---------- Teams ----------

export const searchTeams = async ({ search, league, season, page = 1 }) => {
  // api-sports.io rejects `season` combined with `search`
  const res = await footballApi("/teams", {
    search,
    league,
    season: search ? undefined : season ?? getCurrentSeason(),
    page,
  });
  return res.map(r => normalizeTeam(r.team));
};

export const getLeagueTeams = async ({ league, season }) => {
  const res = await footballApi("/teams", {
    league,
    season: season ?? getCurrentSeason(),
  });
  return res.map(r => normalizeTeam(r.team));
};

export const getTeam = async id => {
  const res = await footballApi("/teams", { id });
  if (!res.length) return null;
  const t = res[0];
  return {
    ...normalizeTeam(t.team ?? t),
    venue: t.venue
      ? {
          name: t.venue.name ?? null,
          city: t.venue.city ?? null,
          capacity: t.venue.capacity ?? null,
          surface: t.venue.surface ?? null,
          image: t.venue.image ?? null,
        }
      : null,
  };
};

export const getTeamLeagues = async team => {
  const res = await footballApi("/leagues", { team, current: true });
  return res.map(normalizeLeague);
};

export const getTeamStatistics = async ({ team, league, season }) => {
  const res = await footballApi("/teams/statistics", {
    team,
    league,
    season: season ?? getCurrentSeason(),
  });
  return res?.[0] ?? null;
};

// ---------- Players ----------

export const getPlayer = async id => {
  const res = await footballApi("/players", {
    id,
    season: getCurrentSeason(),
  });
  const p = res?.[0]?.player;
  if (!p) return null;
  const statistics = res[0].statistics ?? [];
  // The league object in player statistics has no `type` field, so pick
  // the domestic league entry by most appearances — it always has the
  // highest app count (30+ vs cups/internationals).
  const num = v => (typeof v === "number" ? v : 0);
  const primary =
    statistics.find(s => s.league?.type === "League") ??
    statistics.reduce(
      (best, s) =>
        num(s.games?.appearences) > num(best?.games?.appearences) ? s : best,
      null,
    );
  return {
    ...normalizePlayer(p),
    team: primary?.team ? normalizeTeam(primary.team) : null,
    primaryLeague: primary?.league ?? null,
    statistics: primary
      ? [primary, ...statistics.filter(s => s !== primary)]
      : statistics,
  };
};

export const searchPlayers = async ({ search, team, league, season }) => {
  const res = await footballApi("/players", {
    search,
    team,
    league,
    season: season ?? getCurrentSeason(),
  });
  return res.map(r => ({
    ...normalizePlayer(r.player),
    team: r.statistics?.[0]?.team ? normalizeTeam(r.statistics[0].team) : null,
    position: r.player?.pos ?? null,
    statistics: r.statistics ?? [],
  }));
};

/** Global player search — /players requires a league/team, so profiles is used. */
export const searchPlayerProfiles = async ({ search }) => {
  const res = await footballApi("/players/profiles", { search });
  return res.map(r => normalizePlayer(r.player));
};

export const getTopScorers = async ({ league, season }) => {
  const res = await footballApi("/players/topscorers", {
    league,
    season: season ?? getCurrentSeason(),
  });
  return res.map(r => ({
    player: normalizePlayer(r.player),
    statistics: r.statistics ?? [],
  }));
};

export const getTopAssists = async ({ league, season }) => {
  const res = await footballApi("/players/topassists", {
    league,
    season: season ?? getCurrentSeason(),
  });
  return res.map(r => ({
    player: normalizePlayer(r.player),
    statistics: r.statistics ?? [],
  }));
};
