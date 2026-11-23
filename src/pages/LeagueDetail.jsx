import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { Container } from "../ui/Container";
import {
  useLeague,
  useStandings,
  useLeagueFixtures,
  useTopScorers,
  useTopAssists,
} from "../hooks/football";
import { getCurrentSeason } from "../services/football/leagues";
import SectionHeader from "../components/football/SectionHeader";
import LeagueTable from "../components/football/LeagueTable";
import MatchList from "../components/football/MatchList";
import EmptyState from "../components/football/EmptyState";
import { MatchListSkeleton, CardGridSkeleton } from "../components/football/Skeleton";
import TeamLogo from "../components/football/TeamLogo";
import ScorerRow from "../components/football/ScorerRow";
import Spinner from "../ui/Spinner";
import FollowButton from "../components/user/FollowButton";
import ImageDownloadButton from "../components/football/ImageDownloadButton";
import { RiArrowLeftLine } from "react-icons/ri";

const LeagueDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: league, isLoading } = useLeague(id);
  const [season, setSeason] = useState(null);
  const scorersRef = useRef(null);
  const assistsRef = useRef(null);
  const activeSeason = season ?? league?.currentSeason ?? getCurrentSeason();

  const { data: standings, isLoading: standingsLoading } = useStandings({
    league: id,
    season: activeSeason,
  });
  const { data: fixtures } = useLeagueFixtures({
    league: id,
    season: activeSeason,
  });
  const { data: scorers = [] } = useTopScorers({
    league: id,
    season: activeSeason,
  });
  const { data: assists = [] } = useTopAssists({
    league: id,
    season: activeSeason,
  });

  if (isLoading) return <Spinner />;
  if (!league)
    return (
      <Container>
        <div className="py-24">
          <EmptyState
            title={t("Compétition introuvable")}
            message={t("Cette compétition n'existe pas ou n'est pas disponible.")}
          />
        </div>
      </Container>
    );

  const seasons = (league.seasons ?? [])
    .map(s => s.year)
    .sort((a, b) => b - a)
    .slice(0, 10);

  return (
    <Container>
      <div className="py-8">
        <Link
          to="/ligues"
          className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold hover:text-emerald-300 mb-6"
        >
          <RiArrowLeftLine /> {t("Toutes les compétitions")}
        </Link>

        {/* League header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-6 mb-8">
          <img
            src={league.logo}
            alt={league.name}
            className="w-20 h-20 object-contain"
            onError={e => (e.target.style.display = "none")}
          />
          <div className="flex-1">
            <h1 className="text-3xl font-black text-gray-50 font-menu tracking-wide uppercase">
              {league.name}
            </h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              {league.flag && (
                <img
                  src={league.flag}
                  alt={league.country ?? ""}
                  className="w-6 h-4 rounded-sm object-cover"
                />
              )}
              {league.country}
              {league.country && league.type ? " · " : ""}
              {league.type}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <FollowButton
              entityType="competition"
              entityId={league.id}
              entityName={league.name}
              entityLogo={league.logo}
            />
            {seasons.length > 1 && (
              <select
                value={activeSeason}
                onChange={e => setSeason(Number(e.target.value))}
                className="px-4 py-2.5 rounded-full fa-input text-sm text-gray-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {seasons.map(y => (
                  <option key={y} value={y}>
                    {t("Saison {{year}}", { year: y })}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 fa-stagger">
          {/* Standings */}
          <div className="xl:col-span-2">
            <SectionHeader title={t("Classement")} />
            {standingsLoading ? (
              <CardGridSkeleton count={3} />
            ) : standings?.length ? (
              <LeagueTable
                groups={standings}
                filename={`classement-${league.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              />
            ) : (
              <EmptyState
                title={t("Classement indisponible")}
                message={t("Le classement n'est pas disponible pour cette saison.")}
              />
            )}
          </div>

          {/* Top lists */}
          <div className="flex flex-col gap-6">
            <div
              ref={scorersRef}
              className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-emerald-900/40 border-b border-emerald-900/60 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  {t("Meilleurs buteurs")}
                </span>
                <ImageDownloadButton
                  getNode={() => scorersRef.current}
                  filename={`top-buteurs-${league.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  iconOnly
                  className="!px-2 !py-1"
                />
              </div>
              {scorers.length ? (
                scorers.slice(0, 10).map(e => (
                  <ScorerRow key={e.player.id} entry={e} metric="goals" />
                ))
              ) : (
                <p className="text-gray-500 text-sm p-4 text-center">
                  {t("Aucune donnée")}
                </p>
              )}
            </div>
            <div
              ref={assistsRef}
              className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-emerald-900/40 border-b border-emerald-900/60 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  {t("Meilleurs passeurs")}
                </span>
                <ImageDownloadButton
                  getNode={() => assistsRef.current}
                  filename={`top-passeurs-${league.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  iconOnly
                  className="!px-2 !py-1"
                />
              </div>
              {assists.length ? (
                assists.slice(0, 10).map(e => (
                  <ScorerRow key={e.player.id} entry={e} metric="assists" />
                ))
              ) : (
                <p className="text-gray-500 text-sm p-4 text-center">
                  {t("Aucune donnée")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fixtures */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 fa-stagger">
          <div>
            <SectionHeader title={t("Prochains matchs")} />
            {fixtures?.next?.length ? (
              <MatchList fixtures={fixtures.next} />
            ) : (
              <EmptyState title={t("Aucun match à venir")} />
            )}
          </div>
          <div>
            <SectionHeader title={t("Derniers résultats")} />
            {fixtures?.last?.length ? (
              <MatchList fixtures={fixtures.last} />
            ) : (
              <EmptyState title={t("Aucun résultat")} />
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default LeagueDetail;
