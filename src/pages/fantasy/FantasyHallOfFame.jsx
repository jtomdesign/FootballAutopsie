import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useAchievements, useLeaderboard, useFantasyComps } from "../../hooks/fantasy";
import { LuTrophy, LuMedal } from "react-icons/lu";

const FantasyHallOfFame = () => {
  const { t } = useTranslation();
  const { user } = useSelector(s => s.user);
  const { data } = useAchievements();
  const { data: comps } = useFantasyComps();
  const season = useMemo(
    () =>
      (comps ?? [])
        .flatMap(c => (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })))
        .find(s => s.status === "active") ?? null,
    [comps],
  );
  const { data: board } = useLeaderboard({ seasonId: season?.id, limit: 10 });

  const unlocked = data?.unlocked ?? [];
  const all = data?.all ?? [];
  const myUnlocked = unlocked.filter(u => u.fantasy_teams?.user_id === user?.id || true);

  return (
    <div className="space-y-6">
      {/* Trophy cabinet */}
      <div>
        <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2">
          <LuTrophy className="text-amber-500" /> {t("Vitrine des succès")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {all.map(a => {
            const got = unlocked.some(u => u.achievement_id === a.id);
            const mine = unlocked.some(
              u => u.achievement_id === a.id &&
                String(u.fantasy_teams?.user_id) === String(user?.id),
            );
            return (
              <div key={a.id}
                className={`rounded-2xl border p-4 text-center ${
                  got ? "border-amber-300 bg-amber-50" : "border-gray-200 opacity-50"
                }`}>
                <div className="text-3xl mb-2">{got ? "🏆" : "🔒"}</div>
                <p className="text-sm font-bold text-gray-900">{a.name_fr}</p>
                <p className="text-xs text-gray-500 mt-1">{a.description_fr}</p>
                {mine && (
                  <p className="text-[10px] font-black uppercase text-emerald-600 mt-2">
                    {t("Débloqué par vous")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legends — top managers */}
      <div className="rounded-2xl bg-emerald-950 text-white overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2">
          <LuMedal className="text-amber-400" />
          <h3 className="font-black">{t("Légendes de la saison")}</h3>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {(board ?? []).slice(0, 10).map((row, i) => {
              const team = row.fantasy_teams;
              const isMe = String(team?.user_id) === String(user?.id);
              return (
                <tr key={row.team_id}
                  className={`border-t border-white/10 ${isMe ? "bg-emerald-500/20" : ""}`}>
                  <td className="px-5 py-3 w-12">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (
                      <span className="font-black text-emerald-300/60">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 font-bold">{team?.name}</td>
                  <td className="px-5 py-3 text-right font-black text-amber-300">
                    {row.points} pts
                  </td>
                </tr>
              );
            })}
            {!board?.length && (
              <tr><td className="px-5 py-8 text-center text-emerald-200/50">
                {t("Pas encore de classement.")}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FantasyHallOfFame;
