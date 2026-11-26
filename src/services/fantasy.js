import { supabase } from "./supabase";

const uid = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

// ---------- Lookups ----------

export const getFantasyComps = async () => {
  const { data, error } = await supabase
    .from("fantasy_comps")
    .select("*, fantasy_seasons(*)")
    .eq("enabled", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const getFantasySeason = async seasonId => {
  const { data, error } = await supabase
    .from("fantasy_seasons")
    .select("*, fantasy_comps(name, api_league_id, logo), fantasy_gameweeks(*)")
    .eq("id", seasonId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getActiveGameweek = async seasonId => {
  const { data, error } = await supabase
    .from("fantasy_gameweeks")
    .select("*")
    .eq("season_id", seasonId)
    .in("status", ["open", "live", "deadline_passed"])
    .order("number")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getScoringRules = async () => {
  const { data, error } = await supabase
    .from("fantasy_scoring_rules")
    .select("rules")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data?.rules ?? null;
};

// ---------- Players ----------

export const searchFantasyPlayers = async ({
  seasonId,
  apiLeagueId,
  position,
  clubApiId,
  minPrice,
  maxPrice,
  search,
  sort = "points",
  limit = 60,
  offset = 0,
} = {}) => {
  let q = supabase
    .from("fantasy_players")
    .select("*, fantasy_player_stats(points, season_id, gw)", { count: "exact" })
    .eq("enabled", true);

  if (position) q = q.eq("position", position);
  if (apiLeagueId) q = q.eq("api_league_id", apiLeagueId);
  if (clubApiId) q = q.eq("club_api_id", clubApiId);
  if (minPrice != null) q = q.gte("price", minPrice);
  if (maxPrice != null) q = q.lte("price", maxPrice);
  if (search?.trim()) q = q.ilike("name", `%${search.trim()}%`);

  // Sort by total points requires a computed column — fetch then sort client-side
  // for the player pool sizes we deal with (hundreds, not millions).
  const { data, error, count } = await q.limit(500);
  if (error) throw error;

  const seasonStats = (data ?? []).map(p => {
    const stats = (p.fantasy_player_stats ?? []).filter(
      s => String(s.season_id) === String(seasonId),
    );
    const total = stats.reduce((a, s) => a + Number(s.points ?? 0), 0);
    const lastGw = stats.length
      ? stats.reduce((a, s) => Math.max(a, s.gw ?? 0), 0)
      : 0;
    const lastPts = stats
      .filter(s => s.gw === lastGw)
      .reduce((a, s) => a + Number(s.points ?? 0), 0);
    return { ...p, totalPoints: total, lastGwPoints: lastPts, apps: stats.length };
  });

  const sorted = seasonStats.sort((a, b) => {
    switch (sort) {
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "name": return a.name.localeCompare(b.name);
      case "points":
      default: return b.totalPoints - a.totalPoints;
    }
  });

  return {
    players: sorted.slice(offset, offset + limit),
    total: count ?? sorted.length,
  };
};

// ---------- My team ----------

export const getMyTeam = async seasonId => {
  const id = await uid();
  if (!id) return null;
  const { data: team, error } = await supabase
    .from("fantasy_teams")
    .select("*")
    .eq("user_id", id)
    .eq("season_id", seasonId)
    .maybeSingle();
  if (error) throw error;
  if (!team) return null;

  const [{ data: squad }, { data: lineup }] = await Promise.all([
    supabase
      .from("fantasy_team_players")
      .select("player_id, price_paid, fantasy_players(*)")
      .eq("team_id", team.id),
    supabase
      .from("fantasy_lineups")
      .select("*")
      .eq("team_id", team.id),
  ]);

  return { ...team, squad: squad ?? [], lineup: lineup ?? [] };
};

export const getTeamSquad = async teamId => {
  const { data, error } = await supabase
    .from("fantasy_team_players")
    .select("player_id, price_paid, fantasy_players(*)")
    .eq("team_id", teamId);
  if (error) throw error;
  return data ?? [];
};

export const getLeaderboard = async ({ seasonId, limit = 50, gw } = {}) => {
  if (gw != null) {
    const { data, error } = await supabase
      .from("fantasy_manager_points")
      .select("team_id, gw, points, rank_overall, rank_gw, fantasy_teams(name, badge, total_points, user_id)")
      .eq("season_id", seasonId)
      .eq("gw", gw)
      .order("points", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
  // Overall: aggregate points across all gameweeks per team
  const { data, error } = await supabase
    .from("fantasy_manager_points")
    .select("team_id, points, fantasy_teams(name, badge, total_points, user_id)")
    .eq("season_id", seasonId);
  if (error) throw error;
  const totals = new Map();
  (data ?? []).forEach(r => {
    const cur = totals.get(r.team_id) ?? { team_id: r.team_id, points: 0, fantasy_teams: r.fantasy_teams };
    cur.points += Number(r.points ?? 0);
    totals.set(r.team_id, cur);
  });
  return [...totals.values()]
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
};

// ---------- Mutations (all go through validating RPCs) ----------

export const fantasyCreateTeam = async ({ seasonId, name, badge, playerIds }) => {
  const { data, error } = await supabase.rpc("fantasy_create_team", {
    p_season_id: seasonId,
    p_name: name,
    p_badge: badge ?? null,
    p_player_ids: playerIds,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const fantasyTransfer = async ({ teamId, outPlayerId, inPlayerId }) => {
  const { data, error } = await supabase.rpc("fantasy_transfer", {
    p_team_id: teamId,
    p_out_player_id: outPlayerId,
    p_in_player_id: inPlayerId,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const fantasySetLineup = async ({
  teamId, gw, starters, benchOrder, captain, vc,
}) => {
  const { error } = await supabase.rpc("fantasy_set_lineup", {
    p_team_id: teamId,
    p_gw: gw,
    p_starters: starters,
    p_bench_order: benchOrder,
    p_captain: captain,
    p_vc: vc ?? null,
  });
  if (error) throw new Error(error.message);
};

export const getMyPoints = async ({ seasonId, teamId, gw }) => {
  let q = supabase
    .from("fantasy_manager_points")
    .select("*")
    .eq("season_id", seasonId);
  if (teamId) q = q.eq("team_id", teamId);
  if (gw != null) q = q.eq("gw", gw);
  const { data, error } = await q.order("gw");
  if (error) throw error;
  return data ?? [];
};

export const getPlayerGameweekPoints = async ({ playerIds, seasonId }) => {
  if (!playerIds?.length) return [];
  const { data, error } = await supabase
    .from("fantasy_player_stats")
    .select("*")
    .eq("season_id", seasonId)
    .in("player_id", playerIds)
    .order("gw");
  if (error) throw error;
  return data ?? [];
};

// ---------- Admin ----------

export const syncFantasyPlayers = async ({ compApiLeagueId, apiSeason }) => {
  // Pulls players from API-Football via our /api/football proxy and upserts
  // into fantasy_players. Called from the admin dashboard.
  const { data: comp } = await supabase
    .from("fantasy_comps")
    .select("id")
    .eq("api_league_id", compApiLeagueId)
    .single();
  if (!comp) throw new Error("Competition not configured");

  // API-Football paginates — fetch all pages (stop on empty page)
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(
      `/api/football?path=/players&league=${compApiLeagueId}&season=${apiSeason}&page=${page}`,
    );
    const json = await res.json();
    const batch = json?.response ?? [];
    all.push(...batch);
    const total = json?.paging?.total ?? all.length;
    if (!batch.length || all.length >= total) break;
  }
  const players = all;
  if (!players.length) throw new Error("No players returned by API");

  const POS = {
    Goalkeeper: "G", Defender: "D", Midfielder: "M",
    Attacker: "F", Forward: "F",
  };
  const rows = players.map(p => {
    const rawPos = p.statistics?.[0]?.games?.position;
    const pos = POS[rawPos] ?? rawPos ?? "M";
    return {
      api_player_id: p.player.id,
      api_league_id: compApiLeagueId,
      name: p.player.name,
      position: ["G", "D", "M", "F"].includes(pos) ? pos : "M",
      club_api_id: p.statistics?.[0]?.team?.id ?? null,
      club_name: p.statistics?.[0]?.team?.name ?? null,
      club_logo: p.statistics?.[0]?.team?.logo ?? null,
      photo: p.player.photo ?? null,
      nationality: p.player.nationality ?? null,
      enabled: true,
      // Default price by position until admin adjusts
      price: { G: 4.5, D: 4.5, M: 5.5, F: 7.0 }[pos] ?? 5.0,
    };
  });

  const { error } = await supabase
    .from("fantasy_players")
    .upsert(rows, { onConflict: "api_player_id" });
  if (error) throw error;
  return rows.length;
};

// ---------- Leagues ----------

export const getFantasyLeagues = async seasonId => {
  const { data, error } = await supabase
    .from("fantasy_leagues")
    .select("*, fantasy_league_members(count)")
    .eq("season_id", seasonId)
    .eq("is_active", true)
    .order("type")
    .order("name");
  if (error) throw error;
  return data ?? [];
};

export const getLeagueDetail = async leagueId => {
  const { data: league, error } = await supabase
    .from("fantasy_leagues")
    .select("*")
    .eq("id", leagueId)
    .maybeSingle();
  if (error) throw error;
  if (!league) return null;

  const [{ data: members }, { data: h2h }] = await Promise.all([
    supabase
      .from("fantasy_league_members")
      .select("team_id, joined_at, fantasy_teams(name, badge, total_points, user_id)")
      .eq("league_id", leagueId)
      .order("joined_at"),
    supabase
      .from("fantasy_h2h_fixtures")
      .select("*")
      .eq("league_id", leagueId)
      .order("gw"),
  ]);

  return { ...league, members: members ?? [], h2h: h2h ?? [] };
};

export const createFantasyLeague = async ({ seasonId, name, description, type, maxMembers }) => {
  const { data, error } = await supabase.rpc("fantasy_create_league", {
    p_season_id: seasonId,
    p_name: name,
    p_description: description ?? null,
    p_type: type,
    p_max_members: maxMembers ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const joinFantasyLeague = async identifier => {
  const { data, error } = await supabase.rpc("fantasy_join_league", {
    p_identifier: identifier,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const leaveFantasyLeague = async leagueId => {
  const { error } = await supabase.rpc("fantasy_leave_league", {
    p_league_id: leagueId,
  });
  if (error) throw new Error(error.message);
};

export const generateH2H = async (leagueId, gw) => {
  const { data, error } = await supabase.rpc("fantasy_generate_h2h", {
    p_league_id: leagueId,
    p_gw: gw,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const getLeagueTable = async leagueId => {
  // Points per member team across the season
  const { data: members } = await supabase
    .from("fantasy_league_members")
    .select("team_id, fantasy_teams(name, badge, total_points, user_id)")
    .eq("league_id", leagueId);
  if (!members?.length) return [];
  const teamIds = members.map(m => m.team_id);
  const { data: pts } = await supabase
    .from("fantasy_manager_points")
    .select("team_id, points")
    .in("team_id", teamIds);
  const totals = {};
  (pts ?? []).forEach(p => {
    totals[p.team_id] = (totals[p.team_id] ?? 0) + Number(p.points ?? 0);
  });
  return members
    .map(m => ({
      team_id: m.team_id,
      name: m.fantasy_teams?.name,
      badge: m.fantasy_teams?.badge,
      user_id: m.fantasy_teams?.user_id,
      points: totals[m.team_id] ?? 0,
    }))
    .sort((a, b) => b.points - a.points);
};

// ---------- Stories ----------

export const getFantasyStories = async () => {
  const { data, error } = await supabase
    .from("fantasy_stories")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  // Resolve author display names via the public RPC (user_profiles is RLS-locked)
  const { getCommentAuthors } = await import("./user");
  const ids = [...new Set((data ?? []).map(s => s.user_id))];
  const authors = await getCommentAuthors(ids).catch(() => ({}));
  return (data ?? []).map(s => ({ ...s, author: authors[s.user_id] ?? null }));
};

export const createFantasyStory = async ({ text, imageUrl, teamId, seasonId }) => {
  const id = await uid();
  if (!id) throw new Error("not authenticated");
  const { error } = await supabase.from("fantasy_stories").insert({
    user_id: id, text, image_url: imageUrl ?? null,
    team_id: teamId ?? null, season_id: seasonId ?? null,
  });
  if (error) throw error;
};

export const deleteFantasyStory = async storyId => {
  const { error } = await supabase.from("fantasy_stories").delete().eq("id", storyId);
  if (error) throw error;
};

export const markStoryViewed = async storyId => {
  const id = await uid();
  if (!id) return;
  await supabase.from("fantasy_story_views").upsert(
    { story_id: storyId, user_id: id },
    { onConflict: "story_id,user_id" },
  );
};

export const reactToStory = async (storyId, emoji) => {
  const id = await uid();
  if (!id) throw new Error("not authenticated");
  const { error } = await supabase.from("fantasy_story_reactions").upsert(
    { story_id: storyId, user_id: id, emoji },
    { onConflict: "story_id,user_id" },
  );
  if (error) throw error;
};

// ---------- Achievements ----------

export const getAchievements = async () => {
  const [{ data: all }, { data: unlocked }] = await Promise.all([
    supabase.from("fantasy_achievements").select("*").order("sort"),
    supabase.from("fantasy_manager_achievements")
      .select("*, fantasy_achievements(*), fantasy_teams(user_id)"),
  ]);
  return { all: all ?? [], unlocked: unlocked ?? [] };
};

export const checkAchievements = async teamId => {
  const { data, error } = await supabase.rpc("fantasy_check_achievements", {
    p_team_id: teamId,
  });
  if (error) throw error;
  return data;
};

// ---------- Challenges ----------

export const getChallenges = async seasonId => {
  let q = supabase.from("fantasy_challenges")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (seasonId) q = q.eq("season_id", seasonId);
  const { data, error } = await q.limit(10);
  if (error) throw error;
  return data ?? [];
};
