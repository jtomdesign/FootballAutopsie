import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { Container } from "../ui/Container";
import { usePlayer } from "../hooks/football";
import { useEntityFollowers } from "../hooks/user";
import SectionHeader from "../components/football/SectionHeader";
import { useSEO, metaDescription, SITE_URL } from "../utils/seo";
import TeamLogo from "../components/football/TeamLogo";
import EmptyState from "../components/football/EmptyState";
import Spinner from "../ui/Spinner";
import FollowButton from "../components/user/FollowButton";
import CountUp from "../ui/CountUp";
import {
  LuArrowLeft,
  LuActivity,
  LuUsers,
  LuCake,
  LuShieldCheck,
  LuMapPin,
} from "react-icons/lu";

// API sometimes returns {} for missing stats — only render primitives.
const display = v => (v == null || typeof v === "object" ? "—" : v);

const InfoItem = ({ label, value, icon: Icon }) => {
  const { t } = useTranslation();
  return (
  <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-xl p-4">
    <p className="flex items-center gap-1.5 text-[0.65rem] tracking-wide text-gray-500">
      {Icon && <Icon className="text-emerald-500" />}
      {t(label)}
    </p>
    <p className="text-gray-100 font-semibold mt-1">{display(value)}</p>
  </div>
  );
};

const StatCell = ({ label, value }) => {
  const { t } = useTranslation();
  return (
  <div className="text-center py-3 border-b border-emerald-900/40 last:border-0">
    <p className="text-xl font-bold text-emerald-400 tabular-nums">{display(value)}</p>
    <p className="text-[0.6rem] tracking-wide text-gray-500 mt-0.5">
      {t(label)}
    </p>
  </div>
  );
};

const PlayerDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: player, isLoading } = usePlayer(id);
  const { data: followers } = useEntityFollowers("player", player?.id);
  useSEO({
    title: player?.name,
    description: player
      ? metaDescription(
          `Profil de ${player.name}${player.nationality ? ` (${player.nationality})` : ""}${player.position ? `, ${player.position}` : ""} : statistiques, club, palmarès et actualités sur Football Autopsie.`,
        )
      : undefined,
    path: `/joueurs/${id}`,
    image: player?.photo || undefined,
    jsonLd: player
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Person",
            name: player.name,
            url: `${SITE_URL}/joueurs/${player.id}`,
            image: player.photo || undefined,
            jobTitle: player.position || undefined,
            nationality: player.nationality
              ? { "@type": "Country", name: player.nationality }
              : undefined,
            birthDate: player.birth?.date || undefined,
            birthPlace: player.birth?.place || undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Joueurs", item: `${SITE_URL}/joueurs` },
              { "@type": "ListItem", position: 3, name: player.name, item: `${SITE_URL}/joueurs/${player.id}` },
            ],
          },
        ]
      : undefined,
  });

  if (isLoading) return <Spinner />;
  if (!player)
    return (
      <Container>
        <div className="py-24">
          <EmptyState title={t("Joueur introuvable")} />
        </div>
      </Container>
    );

  const stats = player.statistics ?? [];
  const current = stats[0] ?? {};

  // Stats for the player's respective league, restricted to its current
  // (most recent) season — domestic leagues have the most appearances.
  const leagueId = player.primaryLeague?.id;
  const leagueEntries = leagueId
    ? stats.filter(s => s.league?.id === leagueId)
    : stats.slice(0, 1);
  const leagueSeason = leagueEntries.length
    ? Math.max(...leagueEntries.map(s => s.league?.season ?? 0))
    : null;
  const scope = leagueEntries.filter(
    s => s.league?.season === leagueSeason,
  );
  const otherComps = stats.filter(
    s =>
      s.league?.id !== leagueId &&
      s.league?.season === leagueSeason &&
      s.league?.season != null,
  );
  const scopeKeys = new Set(scope);
  const otherKeys = new Set(otherComps);
  const pastStats = stats.filter(
    s => !scopeKeys.has(s) && !otherKeys.has(s),
  );

  const num = v => (typeof v === "number" ? v : 0);
  const agg = scope.reduce(
    (a, s) => ({
      apps: a.apps + num(s.games?.appearences),
      minutes: a.minutes + num(s.games?.minutes),
      goals: a.goals + num(s.goals?.total),
      assists: a.assists + num(s.goals?.assists),
      shots: a.shots + num(s.shots?.total),
      shotsOn: a.shotsOn + num(s.shots?.on),
      passesTotal: a.passesTotal + num(s.passes?.total),
      accWeight:
        a.accWeight + num(s.passes?.accuracy) * num(s.passes?.total),
      tackles: a.tackles + num(s.tackles?.total),
      interceptions: a.interceptions + num(s.tackles?.interceptions),
      duelsWon: a.duelsWon + num(s.duels?.won),
      yellow: a.yellow + num(s.cards?.yellow),
      red: a.red + num(s.cards?.red),
    }),
    {
      apps: 0, minutes: 0, goals: 0, assists: 0, shots: 0, shotsOn: 0,
      passesTotal: 0, accWeight: 0, tackles: 0, interceptions: 0,
      duelsWon: 0, yellow: 0, red: 0,
    },
  );
  const passAccuracy = agg.passesTotal
    ? Math.round(agg.accWeight / agg.passesTotal)
    : null;

  const fmtDate = iso =>
    iso
      ? new Date(iso).toLocaleDateString(
          i18n.language?.startsWith("en") ? "en-GB" : "fr-FR",
        )
      : null;

  return (
    <Container>
      <div className="py-8 max-w-4xl mx-auto">
        <Link
          to="/joueurs"
          className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold hover:text-emerald-300 mb-6"
        >
          <LuArrowLeft /> {t("Tous les joueurs")}
        </Link>

        {/* Header */}
        <div className="fa-profile-card relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8">
          <div className="fa-profile-glow pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="fa-profile-glow pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-emerald-400/50 bg-emerald-900/40 shadow-[0_0_35px_-5px_rgba(16,185,129,0.5)]">
                <TeamLogo
                  logo={player.photo}
                  name={player.name}
                  size="w-full h-full"
                />
              </div>
              {typeof current.games?.number === "number" && (
                <span className="absolute -bottom-2 -left-2 w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {current.games.number}
                </span>
              )}
              {player.injured && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[0.6rem] font-semibold tracking-wide whitespace-nowrap">
                  {t("Blessé")}
                </span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="fa-profile-name text-3xl sm:text-4xl font-bold font-menu tracking-wide">
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                {player.position && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wide">
                    {player.position}
                  </span>
                )}
                {player.team?.id && (
                  <Link
                    to={`/equipes/${player.team.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-800 text-xs text-gray-200 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                  >
                    <TeamLogo
                      logo={player.team.logo}
                      name={player.team.name}
                      size="w-3.5 h-3.5"
                    />
                    {player.team.name}
                  </Link>
                )}
                {player.nationality && (
                  <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                    <LuMapPin className="text-emerald-500" />
                    {player.nationality}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {followers != null && (
                <div className="text-center bg-transparent">
                  <CountUp
                    value={followers}
                    className="text-2xl font-semibold text-gray-50 tabular-nums bg-transparent"
                  />
                  <p className="text-[0.6rem] tracking-wide text-gray-500 -mt-1.5">
                    {t("Abonnés")}
                  </p>
                </div>
              )}
              <FollowButton
                entityType="player"
                entityId={player.id}
                entityName={player.name}
                entityLogo={player.photo}
              />
            </div>
          </div>
        </div>

        {/* Personal info */}
        <SectionHeader title={t("Profil")} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {player.age != null && (
            <InfoItem label={t("Âge")} value={player.age} icon={LuActivity} />
          )}
          {player.birth?.date && (
            <InfoItem
              label={t("Date de naissance")}
              value={`${fmtDate(player.birth.date)}${player.birth.place ? ` — ${player.birth.place}` : ""}`}
              icon={LuCake}
            />
          )}
          {player.nationality && (
            <InfoItem
              label={t("Nationalité")}
              value={player.nationality}
              icon={LuMapPin}
            />
          )}
          {player.height && <InfoItem label={t("Taille")} value={player.height} />}
          {player.weight && <InfoItem label={t("Poids")} value={player.weight} />}
          {player.team?.name && (
            <InfoItem
              label={t("Club")}
              value={player.team.name}
              icon={LuUsers}
            />
          )}
          {(player.position ?? current.position) && (
            <InfoItem
              label={t("Poste")}
              value={player.position ?? current.position}
              icon={LuShieldCheck}
            />
          )}
          {player.injured && (
            <InfoItem label={t("Blessé")} value={t("Oui")} />
          )}
        </div>

        {/* Season stats — current season, all competitions */}
        {scope.length > 0 && (
          <>
            <SectionHeader title={t("Statistiques")} />
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              {scope.length > 1
                ? `${t("Toutes compétitions")} — ${t("Saison en cours {{season}}", { season: leagueSeason })}`
                : `${scope[0].league?.name ?? ""}${
                    scope[0].league?.country?.name ?? scope[0].league?.country
                      ? ` · ${scope[0].league?.country?.name ?? scope[0].league?.country}`
                      : ""
                  } — ${t("Saison en cours {{season}}", { season: leagueSeason })}`}
            </p>
            <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-4 mb-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              <StatCell label={t("Matchs")} value={agg.apps} />
              <StatCell label={t("Minutes")} value={agg.minutes} />
              <StatCell label={t("Buts")} value={agg.goals} />
              <StatCell label={t("Passes")} value={agg.assists} />
              <StatCell label={t("Cartons jaune")} value={agg.yellow} />
              <StatCell label={t("Cartons rouge")} value={agg.red} />
            </div>
            <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-4 mb-10 grid grid-cols-3 sm:grid-cols-6 gap-2">
              <StatCell label={t("Tirs")} value={agg.shots} />
              <StatCell label={t("Tirs cadrés")} value={agg.shotsOn} />
              <StatCell
                label={t("Passes réussies")}
                value={passAccuracy != null ? `${passAccuracy}%` : null}
              />
              <StatCell label={t("Tacles")} value={agg.tackles} />
              <StatCell label={t("Interceptions")} value={agg.interceptions} />
              <StatCell label={t("Duels gagnés")} value={agg.duelsWon} />
            </div>
          </>
        )}

        {/* Other competitions — current season */}
        {otherComps.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              title={t("Autres compétitions")}
              subtitle={t("Saison en cours {{season}}", { season: leagueSeason })}
            />
            <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
              {otherComps.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 border-b border-emerald-900/40 last:border-0 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-100 font-semibold truncate">
                      {s.league?.name}
                    </p>
                    <p className="text-[0.65rem] text-gray-500">
                      {s.team?.name}
                      {s.league?.country?.name ?? s.league?.country
                        ? ` · ${s.league?.country?.name ?? s.league?.country}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {num(s.goals?.total)} {t("buts")}
                  </span>
                  <span className="text-gray-400 tabular-nums">
                    {num(s.goals?.assists)} {t("passes")}
                  </span>
                  <span className="text-gray-400 tabular-nums">
                    {num(s.games?.appearences)} {t("matchs")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Other seasons */}
        {pastStats.length > 0 && (
          <section>
            <SectionHeader title={t("Autres saisons / compétitions")} />
            <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
              {pastStats.slice(0, 8).map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 border-b border-emerald-900/40 last:border-0 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-100 font-semibold truncate">
                      {s.league?.name}
                    </p>
                    <p className="text-[0.65rem] text-gray-500">
                      {s.team?.name} · {s.league?.season}
                    </p>
                  </div>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {typeof s.goals?.total === "number" ? s.goals.total : 0}{" "}
                    {t("buts")}
                  </span>
                  <span className="text-gray-400 tabular-nums">
                    {typeof s.games?.appearences === "number"
                      ? s.games.appearences
                      : 0}{" "}
                    {t("matchs")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Container>
  );
};

export default PlayerDetail;
