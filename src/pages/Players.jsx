import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import {
  usePlayerProfileSearch,
  useTopScorers,
} from "../hooks/football";
import { FEATURED_LEAGUES } from "../services/football/leagues";
import SectionHeader from "../components/football/SectionHeader";
import EmptyState from "../components/football/EmptyState";
import TeamLogo from "../components/football/TeamLogo";
import { CardGridSkeleton } from "../components/football/Skeleton";
import {
  LuSearch,
} from "react-icons/lu";
import { useSEO } from "../utils/seo";

const PlayerCard = ({ player }) => {
  const { t } = useTranslation();
  const stat = player.statistics?.[0] ?? {};
  const goals = stat.goals?.total ?? 0;
  const assists = stat.goals?.assists ?? 0;
  const apps = stat.games?.appearences ?? null;
  return (
    <Link
      to={`/joueurs/${player.id}`}
      className="flex items-center gap-4 bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-4 hover:border-emerald-500/50 hover:bg-emerald-900/30 transition-all group"
    >
      <TeamLogo logo={player.photo} name={player.name} size="w-14 h-14" />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-100 group-hover:text-emerald-300 transition-colors truncate">
          {player.name}
        </h3>
        <p className="text-gray-500 text-xs mt-0.5 truncate">
          {player.position ?? ""}
          {player.team?.name ? ` · ${player.team.name}` : ""}
        </p>
        <p className="text-gray-600 text-[0.65rem] mt-0.5">
          {player.nationality}
        </p>
      </div>
      <div className="text-right shrink-0">
        {player.statistics?.length ? (
          <>
            <p className="text-emerald-400 font-semibold tabular-nums text-lg leading-none">
              {goals}
            </p>
            <p className="text-[0.6rem] text-gray-500 uppercase mt-0.5">
              {t("buts")}
              {apps != null ? ` · ${apps} ${t("matchs")}` : ""}
            </p>
            {assists > 0 && (
              <p className="text-[0.6rem] text-gray-500 tabular-nums">
                {assists} {t("passes")}
              </p>
            )}
          </>
        ) : (
          <p className="text-[0.65rem] text-gray-500 uppercase text-right">
            {player.position ?? ""}
            {player.number != null ? ` · #${player.number}` : ""}
          </p>
        )}
      </div>
    </Link>
  );
};

const Players = () => {
  const { t } = useTranslation();
  useSEO({
    title: "Joueurs de football — profils et statistiques",
    description: "Profils des joueurs de football : statistiques, clubs, palmarès etactualités sur Football Autopsie.",
    path: "/joueurs",
  });
  const [search, setSearch] = useState("");
  const [leagueId, setLeagueId] = useState(FEATURED_LEAGUES[0].id);
  const trimmed = search.trim();

  const { data: searchResults = [], isFetching: searching } =
    usePlayerProfileSearch(trimmed ? { search: trimmed } : {});
  const { data: topScorers = [], isFetching: loadingScorers } = useTopScorers({
    league: leagueId,
  });

  const players = trimmed
    ? searchResults
    : topScorers.map(e => ({
        ...e.player,
        team: e.statistics?.[0]?.team ?? null,
        statistics: e.statistics ?? [],
      }));

  const isFetching = trimmed ? searching : loadingScorers;

  return (
    <Container>
      <div className="py-8">
        <SectionHeader level={1}
          title={t("Joueurs")}
          subtitle={
            trimmed
              ? t("Résultats pour « {{q}} »", { q: trimmed })
              : t("Meilleurs buteurs par compétition")
          }
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("Rechercher un joueur…")}
              className="w-full pl-11 pr-4 py-2.5 rounded-full fa-input text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {!trimmed && (
            <select
              value={leagueId}
              onChange={e => setLeagueId(Number(e.target.value))}
              className="px-4 py-2.5 rounded-full fa-input text-sm text-gray-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {FEATURED_LEAGUES.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {isFetching ? (
          <CardGridSkeleton count={8} />
        ) : players.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fa-stagger">
            {players.slice(0, 40).map(p => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("Aucun joueur trouvé")}
            message={
              trimmed
                ? t("Essayez un autre nom de joueur.")
                : t("Aucun joueur disponible pour cette compétition.")
            }
          />
        )}
      </div>
    </Container>
  );
};

export default Players;
