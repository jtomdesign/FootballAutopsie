import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { Container } from "../ui/Container";
import { usePlayer } from "../hooks/football";
import { useEntityFollowers } from "../hooks/user";
import SectionHeader from "../components/football/SectionHeader";
import TeamLogo from "../components/football/TeamLogo";
import EmptyState from "../components/football/EmptyState";
import Spinner from "../ui/Spinner";
import FollowButton from "../components/user/FollowButton";
import {
  RiArrowLeftLine,
  RiPulseLine,
  RiTeamLine,
  RiCakeLine,
  RiShieldUserLine,
  RiMapPinLine,
} from "react-icons/ri";

// API sometimes returns {} for missing stats — only render primitives.
const display = v => (v == null || typeof v === "object" ? "—" : v);

const InfoItem = ({ label, value, icon: Icon }) => {
  const { t } = useTranslation();
  return (
  <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-xl p-4">
    <p className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-gray-500">
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
    <p className="text-xl font-black text-emerald-400 tabular-nums">{display(value)}</p>
    <p className="text-[0.6rem] uppercase tracking-wider text-gray-500 mt-0.5">
      {t(label)}
    </p>
  </div>
  );
};

const StatGrid = ({ title, children }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
        {t(title)}
      </h3>
      <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl px-4 grid grid-cols-3 sm:grid-cols-6">
        {children}
      </div>
    </div>
  );
};

const PlayerDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: player, isLoading } = usePlayer(id);
  const { data: followers } = useEntityFollowers("player", player?.id);

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
  const games = current.games ?? {};
  const goals = current.goals ?? {};
  const cards = current.cards ?? {};
  const shots = current.shots ?? {};
  const passes = current.passes ?? {};
  const tackles = current.tackles ?? {};
  const duels = current.duels ?? {};
  const dribbles = current.dribbles ?? {};
  const fouls = current.fouls ?? {};
  const penalty = current.penalty ?? {};
  const offsides = current.offsides ?? {};

  const hasGoalkeeping =
    goals.concedes != null || goals.saves != null || penalty.saved != null;

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
          <RiArrowLeftLine /> {t("Tous les joueurs")}
        </Link>

        {/* Header */}
        <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-3xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-emerald-500/30 bg-emerald-900/40">
                <TeamLogo
                  logo={player.photo}
                  name={player.name}
                  size="w-full h-full"
                />
              </div>
              {player.injured && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[0.6rem] font-bold uppercase tracking-wide whitespace-nowrap">
                  {t("Blessé")}
                </span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-50 font-menu tracking-wide uppercase">
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                {player.position && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
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
                    <RiMapPinLine className="text-emerald-500" />
                    {player.nationality}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 shrink-0">
              {typeof games.number === "number" && games.number != null && (
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
                  <span className="text-2xl font-black text-emerald-400">
                    {games.number}
                  </span>
                </div>
              )}
              <FollowButton
                entityType="player"
                entityId={player.id}
                entityName={player.name}
                entityLogo={player.photo}
              />
              {followers != null && (
                <p className="text-xs text-gray-500">
                  {t("{{count}} abonné(s)", { count: followers })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Personal info */}
        <SectionHeader title={t("Profil")} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <InfoItem label={t("Âge")} value={player.age} icon={RiPulseLine} />
          <InfoItem
            label={t("Date de naissance")}
            value={fmtDate(player.birth?.date)}
            icon={RiCakeLine}
          />
          <InfoItem
            label={t("Nationalité")}
            value={player.nationality}
            icon={RiMapPinLine}
          />
          <InfoItem label={t("Taille")} value={player.height} />
          <InfoItem label={t("Poids")} value={player.weight} />
          <InfoItem
            label={t("Club")}
            value={player.team?.name}
            icon={RiTeamLine}
          />
          <InfoItem
            label={t("Poste")}
            value={player.position ?? current.position}
            icon={RiShieldUserLine}
          />
          <InfoItem
            label={t("Blessé")}
            value={player.injured ? t("Oui") : t("Non")}
          />
        </div>

        {/* Season stats */}
        {current.league && (
          <>
            <SectionHeader
              title={t("Statistiques")}
              subtitle={`${current.league.name}${
                current.league.country?.name ?? current.league.country
                  ? ` · ${current.league.country?.name ?? current.league.country}`
                  : ""
              } — ${t("Saison {{season}}", { season: current.league.season ?? "" })}`}
            />
            <div className="mb-8">
              <StatGrid title="Matchs & phase offensive">
                <StatCell label={t("Matchs")} value={games.appearences} />
                <StatCell label={t("Titulaire")} value={games.lineups} />
                <StatCell label={t("Remplaçant")} value={games.substitutes} />
                <StatCell label={t("Minutes")} value={games.minutes} />
                <StatCell label={t("Buts")} value={goals.total} />
                <StatCell label={t("Passes décisives")} value={goals.assists} />
              </StatGrid>

              <StatGrid title={t("Tirs & passes")}>
                <StatCell label={t("Tirs")} value={shots.total} />
                <StatCell label={t("Tirs cadrés")} value={shots.on} />
                <StatCell label={t("Passes")} value={passes.total} />
                <StatCell label={t("Passes clés")} value={passes.key} />
                <StatCell
                  label={t("Précision passes")}
                  value={passes.accuracy != null ? `${passes.accuracy}%` : null}
                />
                <StatCell label={t("Dribbles réussis")} value={dribbles.success} />
              </StatGrid>

              <StatGrid title={t("Défense & discipline")}>
                <StatCell label={t("Tacles")} value={tackles.total} />
                <StatCell label={t("Interceptions")} value={tackles.interceptions} />
                <StatCell label={t("Duels gagnés")} value={duels.won} />
                <StatCell label={t("Fautes commises")} value={fouls.committed} />
                <StatCell label={t("Cartons jaune")} value={cards.yellow} />
                <StatCell label={t("Cartons rouge")} value={cards.red} />
              </StatGrid>

              {(hasGoalkeeping || penalty.won != null || penalty.scored != null || penalty.missed != null || offsides != null) && (
                <StatGrid title={t("Gardien & pénalités")}>
                  <StatCell label={t("Buts encaissés")} value={goals.concedes} />
                  <StatCell label={t("Arrêts")} value={goals.saves} />
                  <StatCell label={t("Pén. marqués")} value={penalty.scored} />
                  <StatCell label={t("Pén. ratés")} value={penalty.missed} />
                  <StatCell label={t("Pén. obtenus")} value={penalty.won} />
                  <StatCell label={t("Hors-jeu")} value={offsides} />
                </StatGrid>
              )}
            </div>
          </>
        )}

        {/* Other seasons */}
        {stats.length > 1 && (
          <section>
            <SectionHeader title={t("Autres saisons / compétitions")} />
            <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
              {stats.slice(1, 8).map((s, i) => (
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
