import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { Container } from "../ui/Container";
import {
  useTeam,
  useTeamLeagues,
  useTeamFixtures,
  usePlayerSearch,
  useStandings,
  useTeamStatistics,
} from "../hooks/football";
import { getCurrentSeason } from "../services/football/leagues";
import SectionHeader from "../components/football/SectionHeader";
import { useSEO, metaDescription, SITE_URL } from "../utils/seo";
import MatchList from "../components/football/MatchList";
import EmptyState from "../components/football/EmptyState";
import TeamLogo from "../components/football/TeamLogo";
import Spinner from "../ui/Spinner";
import FollowButton from "../components/user/FollowButton";
import CountUp from "../ui/CountUp";
import { useEntityFollowers } from "../hooks/user";
import {
  LuArrowLeft,
  LuMapPin,
} from "react-icons/lu";

const StatCard = ({ label, value }) => {
  const { t } = useTranslation();
  return (
  <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-xl p-4 text-center">
    <p className="text-2xl font-black text-emerald-400 tabular-nums">{value ?? "—"}</p>
    <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 mt-1">
      {t(label)}
    </p>
  </div>
  );
};

const TeamDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: team, isLoading } = useTeam(id);
  useSEO({
    title: team?.name,
    description: team
      ? metaDescription(
          `${team.name}${team.country ? ` (${team.country})` : ""} : matchs, résultats, effectif, statistiques et actualités du club sur Football Autopsie.`,
        )
      : undefined,
    path: `/equipes/${id}`,
    image: team?.logo || undefined,
    jsonLd: team
      ? [
          {
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: team.name,
            url: `${SITE_URL}/equipes/${team.id}`,
            logo: team.logo || undefined,
            sport: "Football",
            location: team.country
              ? { "@type": "Country", name: team.country }
              : undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Équipes", item: `${SITE_URL}/equipes` },
              { "@type": "ListItem", position: 3, name: team.name, item: `${SITE_URL}/equipes/${team.id}` },
            ],
          },
        ]
      : undefined,
  });
  const { data: followers } = useEntityFollowers("team", team?.id);
  const { data: leagues = [] } = useTeamLeagues(id);
  const [season, setSeason] = useState(null);
  const activeSeason = season ?? getCurrentSeason();

  const primaryLeague = leagues[0] ?? null;
  const { data: fixtures } = useTeamFixtures({ team: id, season: activeSeason });
  const { data: players = [] } = usePlayerSearch({ team: id, season: activeSeason });
  const { data: standings } = useStandings({
    league: primaryLeague?.id,
    season: activeSeason,
  });
  const { data: stats } = useTeamStatistics({
    team: id,
    league: primaryLeague?.id,
    season: activeSeason,
  });

  if (isLoading) return <Spinner />;
  if (!team)
    return (
      <Container>
        <div className="py-24">
          <EmptyState title={t("Équipe introuvable")} />
        </div>
      </Container>
    );

  const position = standings
    ?.flatMap(g => g.rows)
    .find(r => r.team.id === team.id);

  const form = stats?.form ?? null;
  const fixturesAll = stats?.fixtures ?? null;
  const goals = stats?.goals ?? null;

  return (
    <Container>
      <div className="py-8">
        <Link
          to="/equipes"
          className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold hover:text-emerald-300 mb-6"
        >
          <LuArrowLeft /> {t("Toutes les équipes")}
        </Link>

        {/* Header */}
        <div className="fa-profile-card relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8">
          <div className="fa-profile-glow pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="fa-profile-glow pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative shrink-0 drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <TeamLogo logo={team.logo} name={team.name} size="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="fa-profile-name text-3xl sm:text-4xl font-black font-menu tracking-wide uppercase">
                {team.name}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {team.country ?? (team.national ? t("Sélection nationale") : t("Club"))}
              </p>
              {team.venue && (
                <p className="flex items-center justify-center sm:justify-start gap-1.5 text-gray-500 text-xs mt-2">
                  <LuMapPin /> {team.venue.name}
                  {team.venue.city ? ` — ${team.venue.city}` : ""}
                  {team.venue.capacity
                    ? ` · ${team.venue.capacity.toLocaleString(i18n.language?.startsWith("en") ? "en-GB" : "fr-FR")} ${t("places")}`
                    : ""}
                </p>
              )}
              {position && (
                <p className="text-emerald-400 text-sm font-bold mt-2">
                  {primaryLeague?.name} : {position.rank}e — {position.points} pts
                </p>
              )}
            </div>
            <div className="flex flex-col items-center sm:items-end gap-3">
              <div className="flex items-center gap-4">
                {followers != null && followers > 0 && (
                  <div className="text-center">
                    <CountUp
                      value={followers}
                      className="text-2xl font-semibold text-gray-50 tabular-nums"
                    />
                    <p className="text-[0.6rem] tracking-wide text-gray-500">
                      {t("Abonnés")}
                    </p>
                  </div>
                )}
                <FollowButton
                  entityType="team"
                  entityId={team.id}
                  entityName={team.name}
                  entityLogo={team.logo}
                />
              </div>
              <select
                value={activeSeason}
                onChange={e => setSeason(Number(e.target.value))}
                className="px-4 py-2.5 rounded-full fa-input text-sm text-gray-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {[activeSeason, activeSeason - 1, activeSeason - 2].map(y => (
                  <option key={y} value={y}>
                    {t("Saison {{year}}", { year: y })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {leagues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {leagues.map(l => (
                <Link
                  key={l.id}
                  to={`/ligues/${l.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-800 text-xs text-gray-200 hover:border-emerald-500 transition-colors"
                >
                  <TeamLogo logo={l.logo} name={l.name} size="w-4 h-4" />
                  {l.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Season stats */}
        {stats && (
          <section className="mb-10">
            <SectionHeader title={t("Statistiques de la saison")} />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatCard label={t("Matchs")} value={fixturesAll?.played?.total} />
              <StatCard label={t("Victoires")} value={fixturesAll?.wins?.total} />
              <StatCard label={t("Nuls")} value={fixturesAll?.draws?.total} />
              <StatCard label={t("Défaites")} value={fixturesAll?.loses?.total} />
              <StatCard label={t("Buts marqués")} value={goals?.for?.total?.total} />
              <StatCard label={t("Buts encaissés")} value={goals?.against?.total?.total} />
              <StatCard label={t("Clean sheets")} value={form?.clean_sheet} />
              <StatCard
                label={t("Forme")}
                value={
                  form?.string ? (
                    <span className="flex gap-1 justify-center">
                      {form.string.split("").map((r, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 rounded text-[0.6rem] font-black text-white flex items-center justify-center ${
                            r === "W"
                              ? "bg-emerald-500"
                              : r === "D"
                                ? "bg-gray-500"
                                : "bg-red-600"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </section>
        )}

        {/* Fixtures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
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

        {/* Players */}
        {players.length > 0 && (
          <section>
            <SectionHeader title={t("Joueurs")} subtitle={t("Effectif et statistiques")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {players.slice(0, 12).map(p => (
                <Link
                  key={p.id}
                  to={`/joueurs/${p.id}`}
                  className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-900/60 rounded-xl p-3 hover:border-emerald-500/50 transition-colors"
                >
                  <TeamLogo logo={p.photo} name={p.name} size="w-10 h-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-100 truncate">
                      {p.name}
                    </p>
                    <p className="text-[0.65rem] text-gray-500 truncate">
                      {p.position ?? ""}
                      {p.statistics?.[0]?.games?.appearences != null &&
                        ` · ${p.statistics[0].games.appearences} ${t("matchs")}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Container>
  );
};

export default TeamDetail;
