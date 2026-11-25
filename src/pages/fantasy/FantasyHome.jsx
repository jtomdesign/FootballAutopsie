import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  useFantasyComps,
  useMyTeam,
  useLeaderboard,
  useActiveGameweek,
} from "../../hooks/fantasy";
import Button from "../../ui/Button";
import { LuTrophy, LuClock, LuUsers, LuTarget } from "react-icons/lu";
import { StoriesRail, AchievementsShelf, ChallengesShelf } from "./Social";

const Stat = ({ icon, label, value, sub }) => (
  <div className="rounded-2xl bg-white border border-gray-200 p-4">
    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
      {icon}
      {label}
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const FantasyHome = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useSelector(s => s.user);
  const { data: comps, isLoading } = useFantasyComps();

  // Default: first enabled competition's active season
  const seasons = useMemo(
    () =>
      (comps ?? []).flatMap(c =>
        (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })),
      ),
    [comps],
  );
  const [seasonId, setSeasonId] = useState(null);
  const activeSeason =
    seasons.find(s => String(s.id) === String(seasonId)) ??
    seasons.find(s => s.status === "active") ??
    seasons[0];

  const { data: myTeam } = useMyTeam(activeSeason?.id);
  const { data: gw } = useActiveGameweek(activeSeason?.id);
  const { data: board } = useLeaderboard({
    seasonId: activeSeason?.id,
    limit: 10,
    gw: null,
  });

  if (isLoading) {
    return <p className="text-gray-500 py-10 text-center">{t("Chargement…")}</p>;
  }

  if (!seasons.length) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center">
        <LuTrophy className="mx-auto text-4xl text-emerald-500 mb-3" />
        <h2 className="text-xl font-bold text-gray-900">
          {t("Fantasy arrive bientôt")}
        </h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          {t(
            "La saison fantasy n'est pas encore ouverte. Revenez bientôt pour créer votre équipe.",
          )}
        </p>
      </div>
    );
  }

  const deadline = gw?.deadline
    ? new Date(gw.deadline).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const myRank = board?.findIndex(
    b => String(b.fantasy_teams?.user_id) === String(user?.id),
  );

  return (
    <div className="space-y-6">
      {/* Season selector */}
      <div className="flex flex-wrap items-center gap-2">
        {seasons.map(s => (
          <button
            key={s.id}
            onClick={() => setSeasonId(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              activeSeason?.id === s.id
                ? "bg-emerald-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
            }`}
          >
            {s.comp?.name} · {s.name}
          </button>
        ))}
      </div>

      {/* Welcome */}
      <div className="rounded-2xl bg-emerald-950 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {isAuthenticated
                ? t("Bienvenue, {{name}}", { name: user?.name ?? "Manager" })
                : t("Bienvenue sur Fantasy")}
            </h2>
            <p className="text-emerald-200/80 text-sm mt-1">
              {activeSeason?.comp?.name} · {activeSeason?.name}
              {gw ? ` · ${t("Journée")} ${gw.number}` : ""}
              {deadline ? ` · ${t("Deadline")} ${deadline}` : ""}
            </p>
          </div>
          {isAuthenticated &&
            (myTeam ? (
              <Link to="/fantasy/equipe">
                <Button name={t("Mon équipe")} type="primary" />
              </Link>
            ) : (
              <Link to="/fantasy/equipe">
                <Button name={t("Créer mon équipe")} type="primary" />
              </Link>
            ))}
        </div>
      </div>

      {myTeam && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat
            icon={<LuTarget className="w-4 h-4" />}
            label={t("Points totaux")}
            value={myTeam.total_points ?? 0}
          />
          <Stat
            icon={<LuTrophy className="w-4 h-4" />}
            label={t("Rang global")}
            value={myRank != null && myRank >= 0 ? `#${myRank + 1}` : "—"}
          />
          <Stat
            icon={<LuClock className="w-4 h-4" />}
            label={t("Transferts libres")}
            value={myTeam.free_transfers ?? 0}
          />
          <Stat
            icon={<LuUsers className="w-4 h-4" />}
            label={t("Budget restant")}
            value={`£${Number(myTeam.budget ?? 0).toFixed(1)}m`}
          />
        </div>
      )}

      {/* Social: stories, achievements, challenges */}
      <StoriesRail seasonId={activeSeason?.id} myTeam={myTeam} />
      <div className="grid lg:grid-cols-2 gap-5">
        <AchievementsShelf teamId={myTeam?.id} />
        <ChallengesShelf seasonId={activeSeason?.id} />
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{t("Classement")}</h3>
          <span className="text-xs text-gray-400 font-bold uppercase">
            {t("Globale")}
          </span>
        </div>
        {!board?.length ? (
          <p className="p-6 text-center text-gray-500 text-sm">
            {t("Aucun manager classé pour le moment.")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {board.map((row, i) => {
                const team = row.fantasy_teams;
                const isMe =
                  String(team?.user_id) === String(user?.id);
                return (
                  <tr
                    key={row.team_id}
                    className={`border-b border-gray-50 last:border-0 ${
                      isMe ? "bg-emerald-50" : ""
                    }`}
                  >
                    <td className="px-5 py-2.5 w-10 font-bold text-gray-400">
                      {i + 1}
                    </td>
                    <td className="px-2 py-2.5 font-bold text-gray-900">
                      {team?.name ?? "—"}
                      {isMe && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-emerald-600">
                          {t("Vous")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-emerald-600">
                      {Number(row.points ?? team?.total_points ?? 0)} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FantasyHome;
