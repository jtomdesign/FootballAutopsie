import { useQuery, useQueries } from "@tanstack/react-query";
import {
  getFeaturedLeagues,
  getLeagueById,
  searchLeagues,
  getFixturesByDate,
  getLiveFixtures,
  getFixture,
  getTeamFixtures,
  getLeagueFixtures,
  getStandings,
  searchTeams,
  getLeagueTeams,
  getTeam,
  getTeamLeagues,
  getTeamStatistics,
  getPlayer,
  getPlayerSeasonStatistics,
  searchPlayers,
  getTopScorers,
  getTopAssists,
  searchPlayerProfiles,
} from "../services/football/endpoints";
import { getCurrentSeason } from "../services/football/leagues";

const STALE = 60 * 1000; // 1 min
const LIVE_REFETCH = 30 * 1000; // 30 s for live data

export const useLeagues = () =>
  useQuery({
    queryKey: ["football", "leagues"],
    queryFn: getFeaturedLeagues,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

export const useLeagueSearch = params =>
  useQuery({
    queryKey: ["football", "leagues", "search", params],
    queryFn: () => searchLeagues(params),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(params?.search || params?.country),
    retry: 1,
  });

export const useLeague = id =>
  useQuery({
    queryKey: ["football", "league", id],
    queryFn: () => getLeagueById(id),
    staleTime: STALE,
    enabled: Boolean(id),
    retry: 1,
  });

export const useFixturesByDate = (date, enabled = true) =>
  useQuery({
    queryKey: ["football", "fixtures", "date", date],
    queryFn: () => getFixturesByDate(date),
    staleTime: STALE,
    refetchInterval: query =>
      query.state.data?.some(f => f.status?.isLive) ? LIVE_REFETCH : false,
    enabled: Boolean(date) && enabled,
    retry: 1,
  });

export const useLiveFixtures = () =>
  useQuery({
    queryKey: ["football", "fixtures", "live"],
    queryFn: getLiveFixtures,
    staleTime: 0,
    refetchInterval: LIVE_REFETCH,
    retry: 1,
  });

export const useFixture = id =>
  useQuery({
    queryKey: ["football", "fixture", id],
    queryFn: () => getFixture(id),
    staleTime: STALE,
    refetchInterval: query => {
      const f = query.state.data;
      if (f?.status?.isLive) return LIVE_REFETCH;
      // Lineups are published ~1h before kickoff — poll upcoming matches
      // that are close to starting so the Compositions tab appears on its own.
      if (f?.status?.isUpcoming && f?.date) {
        const ms = new Date(f.date).getTime() - Date.now();
        if (ms > 0 && ms < 3 * 60 * 60 * 1000) return 60 * 1000;
      }
      return false;
    },
    enabled: Boolean(id),
    retry: 1,
  });

export const useTeamFixtures = ({ team, season }) =>
  useQuery({
    queryKey: ["football", "team", team, "fixtures", season],
    queryFn: () => getTeamFixtures({ team, season }),
    staleTime: STALE,
    enabled: Boolean(team),
    retry: 1,
  });

export const useLeagueFixtures = ({ league, season }) =>
  useQuery({
    queryKey: ["football", "league", league, "fixtures", season],
    queryFn: () => getLeagueFixtures({ league, season }),
    staleTime: STALE,
    enabled: Boolean(league),
    retry: 1,
  });

export const useStandings = ({ league, season }) =>
  useQuery({
    queryKey: ["football", "standings", league, season],
    queryFn: () => getStandings({ league, season }),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(league),
    retry: 1,
  });

export const useTeamSearch = params =>
  useQuery({
    queryKey: ["football", "teams", "search", params],
    queryFn: () => searchTeams(params),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(params?.search || params?.league),
    retry: 1,
  });

export const useLeagueTeams = ({ league, season }) =>
  useQuery({
    queryKey: ["football", "league", league, "teams", season],
    queryFn: () => getLeagueTeams({ league, season }),
    staleTime: 60 * 60 * 1000,
    enabled: Boolean(league),
    retry: 1,
  });

export const useTeam = id =>
  useQuery({
    queryKey: ["football", "team", id],
    queryFn: () => getTeam(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
    retry: 1,
  });

export const useTeamLeagues = team =>
  useQuery({
    queryKey: ["football", "team", team, "leagues"],
    queryFn: () => getTeamLeagues(team),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(team),
    retry: 1,
  });

export const useTeamStatistics = ({ team, league, season }) =>
  useQuery({
    queryKey: ["football", "team", team, "stats", league, season],
    queryFn: () => getTeamStatistics({ team, league, season }),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(team),
    retry: 1,
  });

export const usePlayer = id =>
  useQuery({
    queryKey: ["football", "player", id],
    queryFn: () => getPlayer(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
    retry: 1,
  });

/**
 * Career statistics — the /players endpoint only returns one season per
 * call, so fetch the last 8 seasons in parallel and let the caller merge.
 */
export const usePlayerCareerStatistics = id => {
  const currentSeason = getCurrentSeason();
  const seasons = Array.from({ length: 8 }, (_, i) => currentSeason - i);
  return useQueries({
    queries: seasons.map(season => ({
      queryKey: ["football", "player", id, "season-stats", season],
      queryFn: () => getPlayerSeasonStatistics(id, season),
      staleTime: 5 * 60 * 1000,
      enabled: Boolean(id),
      retry: 1,
    })),
  });
};

export const usePlayerSearch = params =>
  useQuery({
    queryKey: ["football", "players", "search", params],
    queryFn: () => searchPlayers(params),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(params?.search || params?.team || params?.league),
    retry: 1,
  });

export const usePlayerProfileSearch = params =>
  useQuery({
    queryKey: ["football", "players", "profiles", params],
    queryFn: () => searchPlayerProfiles(params),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(params?.search),
    retry: 1,
  });

export const useTopScorers = ({ league, season }) =>
  useQuery({
    queryKey: ["football", "topscorers", league, season],
    queryFn: () => getTopScorers({ league, season }),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(league),
    retry: 1,
  });

export const useTopAssists = ({ league, season }) =>
  useQuery({
    queryKey: ["football", "topassists", league, season],
    queryFn: () => getTopAssists({ league, season }),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(league),
    retry: 1,
  });
