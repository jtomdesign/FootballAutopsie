import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFantasyComps,
  getFantasySeason,
  getActiveGameweek,
  getScoringRules,
  searchFantasyPlayers,
  getMyTeam,
  getTeamSquad,
  getLeaderboard,
  getMyPoints,
  getPlayerGameweekPoints,
  fantasyCreateTeam,
  fantasyTransfer,
  fantasySetLineup,
  syncFantasyPlayers,
} from "../services/fantasy";

export const useFantasyComps = () =>
  useQuery({ queryKey: ["fantasy", "comps"], queryFn: getFantasyComps });

export const useFantasySeasonById = seasonId =>
  useQuery({
    queryKey: ["fantasy", "season", seasonId],
    queryFn: () => getFantasySeason(seasonId),
    enabled: !!seasonId,
  });

export const useActiveGameweek = seasonId =>
  useQuery({
    queryKey: ["fantasy", "gw", seasonId],
    queryFn: () => getActiveGameweek(seasonId),
    enabled: !!seasonId,
    refetchInterval: 60_000,
  });

export const useScoringRules = () =>
  useQuery({ queryKey: ["fantasy", "rules"], queryFn: getScoringRules });

export const useFantasyPlayers = params =>
  useQuery({
    queryKey: ["fantasy", "players", params],
    queryFn: () => searchFantasyPlayers(params),
    enabled: params?.enabled !== false,
    placeholderData: prev => prev,
  });

export const useMyTeam = seasonId =>
  useQuery({
    queryKey: ["fantasy", "myteam", seasonId],
    queryFn: () => getMyTeam(seasonId),
    enabled: !!seasonId,
    refetchInterval: 30_000,
  });

export const useTeamSquad = teamId =>
  useQuery({
    queryKey: ["fantasy", "squad", teamId],
    queryFn: () => getTeamSquad(teamId),
    enabled: !!teamId,
  });

export const useLeaderboard = params =>
  useQuery({
    queryKey: ["fantasy", "board", params],
    queryFn: () => getLeaderboard(params),
  });

export const useMyPoints = params =>
  useQuery({
    queryKey: ["fantasy", "points", params],
    queryFn: () => getMyPoints(params),
    enabled: !!params?.seasonId && !!params?.teamId,
  });

export const usePlayerGameweekPoints = params =>
  useQuery({
    queryKey: ["fantasy", "pstats", params],
    queryFn: () => getPlayerGameweekPoints(params),
    enabled: !!params?.seasonId && !!params?.playerIds?.length,
  });

export const useFantasyCreateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fantasyCreateTeam,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["fantasy", "myteam", v.seasonId] });
      qc.invalidateQueries({ queryKey: ["fantasy", "board"] });
    },
  });
};

export const useFantasyTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fantasyTransfer,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["fantasy", "myteam"] });
      qc.invalidateQueries({ queryKey: ["fantasy", "squad"] });
      qc.invalidateQueries({ queryKey: ["fantasy", "players"] });
    },
  });
};

export const useFantasySetLineup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fantasySetLineup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fantasy", "myteam"] }),
  });
};

export const useSyncFantasyPlayers = () =>
  useMutation({ mutationFn: syncFantasyPlayers });

import {
  getFantasyLeagues,
  getLeagueDetail,
  getLeagueTable,
  createFantasyLeague,
  joinFantasyLeague,
  leaveFantasyLeague,
  generateH2H,
} from "../services/fantasy";

export const useFantasyLeagues = seasonId =>
  useQuery({
    queryKey: ["fantasy", "leagues", seasonId],
    queryFn: () => getFantasyLeagues(seasonId),
    enabled: !!seasonId,
  });

export const useLeagueDetail = leagueId =>
  useQuery({
    queryKey: ["fantasy", "league", leagueId],
    queryFn: () => getLeagueDetail(leagueId),
    enabled: !!leagueId,
    refetchInterval: 60_000,
  });

export const useLeagueTable = (leagueId, gw) =>
  useQuery({
    queryKey: ["fantasy", "leaguetable", leagueId, gw],
    queryFn: () => getLeagueTable(leagueId, gw),
    enabled: !!leagueId,
    refetchInterval: 60_000,
  });

export const useCreateLeague = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFantasyLeague,
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["fantasy", "leagues", v.seasonId] }),
  });
};

export const useJoinLeague = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: joinFantasyLeague,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fantasy", "leagues"] }),
  });
};

export const useLeaveLeague = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveFantasyLeague,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fantasy", "leagues"] }),
  });
};

export const useGenerateH2H = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, gw }) => generateH2H(leagueId, gw),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["fantasy", "league", v.leagueId] }),
  });
};

import {
  getFantasyStories, createFantasyStory, deleteFantasyStory,
  markStoryViewed, reactToStory,
  getAchievements, checkAchievements, getChallenges,
} from "../services/fantasy";

export const useFantasyStories = () =>
  useQuery({ queryKey: ["fantasy", "stories"], queryFn: getFantasyStories, refetchInterval: 60_000 });

export const useCreateStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFantasyStory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fantasy", "stories"] }),
  });
};

export const useDeleteStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFantasyStory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fantasy", "stories"] }),
  });
};

export const useMarkStoryViewed = () =>
  useMutation({ mutationFn: markStoryViewed });

export const useReactToStory = () =>
  useMutation({ mutationFn: ({ storyId, emoji }) => reactToStory(storyId, emoji) });

export const useAchievements = () =>
  useQuery({ queryKey: ["fantasy", "achievements"], queryFn: getAchievements });

export const useChallenges = seasonId =>
  useQuery({
    queryKey: ["fantasy", "challenges", seasonId],
    queryFn: () => getChallenges(seasonId),
    enabled: !!seasonId,
  });

export const useCheckAchievements = () =>
  useMutation({ mutationFn: checkAchievements });

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

const SEASON_KEY = "fantasy_season_id";

/**
 * Shared fantasy season selection — persisted in sessionStorage so every
 * fantasy page respects the same competition choice.
 */
export const useFantasySeason = () => {
  const { data: comps, isLoading } = useFantasyComps();
  const seasons = useMemo(
    () =>
      (comps ?? []).flatMap(c =>
        (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })),
      ),
    [comps],
  );
  const [picked, setPicked] = useState(() =>
    sessionStorage.getItem(SEASON_KEY),
  );

  const season =
    seasons.find(s => String(s.id) === String(picked)) ??
    seasons.find(s => s.status === "active") ??
    seasons[0] ??
    null;

  const selectSeason = id => {
    setPicked(String(id));
    sessionStorage.setItem(SEASON_KEY, String(id));
  };

  return { comps, seasons, season, selectSeason, isLoading };
};

/**
 * Live updates: invalidates fantasy queries on any points/lineup/team change.
 * Mount once inside FantasyLayout.
 */
export const useFantasyRealtime = () => {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("fantasy-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fantasy_manager_points" },
        () => qc.invalidateQueries({ queryKey: ["fantasy"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fantasy_player_stats" },
        () => qc.invalidateQueries({ queryKey: ["fantasy"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fantasy_lineups" },
        () => qc.invalidateQueries({ queryKey: ["fantasy", "myteam"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fantasy_teams" },
        () => qc.invalidateQueries({ queryKey: ["fantasy"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fantasy_transfers" },
        () => qc.invalidateQueries({ queryKey: ["fantasy"] }),
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [qc]);
};
