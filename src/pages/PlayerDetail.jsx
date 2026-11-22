import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { Container } from "../ui/Container";
import { usePlayer } from "../hooks/football";
import SectionHeader from "../components/football/SectionHeader";
import TeamLogo from "../components/football/TeamLogo";
import EmptyState from "../components/football/EmptyState";
import Spinner from "../ui/Spinner";
import FollowButton from "../components/user/FollowButton";
import { RiArrowLeftLine } from "react-icons/ri";

const InfoItem = ({ label, value }) => {
  const { t } = useTranslation();
  return (
  <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-xl p-4">
    <p className="text-[0.65rem] uppercase tracking-wider text-gray-500">{t(label)}</p>
    <p className="text-gray-100 font-semibold mt-1">{value ?? "—"}</p>
  </div>
  );
};

const StatCell = ({ label, value }) => {
  const { t } = useTranslation();
  return (
  <div className="text-center py-3 border-b border-emerald-900/40">
    <p className="text-xl font-black text-emerald-400 tabular-nums">{value ?? "—"}</p>
    <p className="text-[0.6rem] uppercase tracking-wider text-gray-500 mt-0.5">
      {t(label)}
    </p>
  </div>
  );
};

const PlayerDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: player, isLoading } = usePlayer(id);

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
            <TeamLogo logo={player.photo} name={player.name} size="w-28 h-28 sm:w-36 sm:h-36" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-50 font-menu tracking-wide uppercase">
                {player.name}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {player.position ?? t("Joueur")}
                {player.team?.name ? ` · ${player.team.name}` : ""}
              </p>
              {player.nationality && (
                <p className="text-gray-500 text-xs mt-1">{player.nationality}</p>
              )}
            </div>
            <div className="flex flex-col items-center gap-3">
              {games.number != null && (
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
            </div>
          </div>
        </div>

        {/* Personal info */}
        <SectionHeader title={t("Profil")} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <InfoItem label={t("Âge")} value={player.age} />
          <InfoItem
            label={t("Date de naissance")}
            value={
              player.birth?.date
                ? new Date(player.birth.date).toLocaleDateString(
                    i18n.language?.startsWith("en") ? "en-GB" : "fr-FR",
                  )
                : null
            }
          />
          <InfoItem label={t("Nationalité")} value={player.nationality} />
          <InfoItem label={t("Taille")} value={player.height} />
          <InfoItem label={t("Poids")} value={player.weight} />
          <InfoItem label={t("Club")} value={player.team?.name} />
          <InfoItem
            label={t("Poste")}
            value={player.position ?? player.statistics?.[0]?.position}
          />
          <InfoItem label={t("Blessé")} value={player.injured ? t("Oui") : t("Non")} />
        </div>

        {/* Season stats */}
        {current.league && (
          <>
            <SectionHeader
              title={t("Statistiques")}
              subtitle={`${current.league.name}${
                current.league.country ? ` · ${current.league.country}` : ""
              } — ${t("Saison {{season}}", { season: current.league.season ?? "" })}`}
            />
            <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-4 mb-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              <StatCell label={t("Matchs")} value={games.appearences} />
              <StatCell label={t("Minutes")} value={games.minutes} />
              <StatCell label={t("Buts")} value={goals.total} />
              <StatCell label={t("Passes")} value={goals.assists} />
              <StatCell label={t("Cartons jaune")} value={cards.yellow} />
              <StatCell label={t("Cartons rouge")} value={cards.red} />
            </div>
            <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-4 mb-10 grid grid-cols-3 sm:grid-cols-6 gap-2">
              <StatCell label={t("Tirs")} value={shots.total} />
              <StatCell label={t("Tirs cadrés")} value={shots.on} />
              <StatCell label={t("Passes réussies")} value={passes.accuracy ? `${passes.accuracy}%` : null} />
              <StatCell label={t("Tacles")} value={tackles.total} />
              <StatCell label={t("Interceptions")} value={tackles.interceptions} />
              <StatCell label={t("Duels gagnés")} value={duels.won} />
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
                    {s.goals?.total ?? 0} {t("buts")}
                  </span>
                  <span className="text-gray-400 tabular-nums">
                    {s.games?.appearences ?? 0} {t("matchs")}
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
