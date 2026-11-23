import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { useTeamSearch, useLeagueTeams } from "../hooks/football";
import { FEATURED_LEAGUES } from "../services/football/leagues";
import SectionHeader from "../components/football/SectionHeader";
import EmptyState from "../components/football/EmptyState";
import TeamLogo from "../components/football/TeamLogo";
import { CardGridSkeleton } from "../components/football/Skeleton";
import { RiSearchLine } from "react-icons/ri";
import { useSEO } from "../utils/seo";

const TeamCard = ({ team }) => {
  const { t } = useTranslation();
  return (
  <Link
    to={`/equipes/${team.id}`}
    className="flex items-center gap-4 bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5 hover:border-emerald-500/50 hover:bg-emerald-900/30 transition-all group"
  >
    <TeamLogo logo={team.logo} name={team.name} size="w-12 h-12" />
    <div className="min-w-0">
      <h3 className="font-bold text-gray-100 group-hover:text-emerald-300 transition-colors truncate">
        {team.name}
      </h3>
      <p className="text-gray-500 text-xs mt-0.5">
        {team.country ?? (team.national ? t("Équipe nationale") : t("Club"))}
      </p>
    </div>
  </Link>
  );
};

const Teams = () => {
  const { t } = useTranslation();
  useSEO({
    title: "Équipes de football — clubs et sélections",
    description: "Découvrez les équipes de football : clubs des grands championnats, sélections nationales, effectifs et statistiques sur Football Autopsie.",
    path: "/equipes",
  });
  const [search, setSearch] = useState("");
  const [leagueId, setLeagueId] = useState(FEATURED_LEAGUES[0].id);
  const trimmed = search.trim();

  const { data: searchResults = [], isFetching: searching } = useTeamSearch({
    search: trimmed || undefined,
  });
  const { data: leagueTeams = [], isFetching: loadingLeague } = useLeagueTeams({
    league: leagueId,
  });

  const teams = trimmed ? searchResults : leagueTeams;
  const isFetching = trimmed ? searching : loadingLeague;

  return (
    <Container>
      <div className="py-8">
        <SectionHeader level={1}
          title={t("Équipes")}
          subtitle={
            trimmed
              ? t("Résultats pour « {{q}} »", { q: trimmed })
              : t("Équipes par compétition")
          }
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("Rechercher une équipe…")}
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
        ) : teams.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fa-stagger">
            {teams.slice(0, 60).map(t => (
              <TeamCard key={t.id} team={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("Aucune équipe trouvée")}
            message={
              trimmed
                ? t("Essayez un autre nom d'équipe.")
                : t("Aucune équipe disponible pour cette compétition.")
            }
          />
        )}
      </div>
    </Container>
  );
};

export default Teams;
