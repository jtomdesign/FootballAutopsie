import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  useFantasySeason,
  useMyTeam,
  useMyPoints,
  useLeaderboard,
  usePlayerGameweekPoints,
  useFantasyPlayers,
} from "../../hooks/fantasy";
import { PositionBadge } from "./components";
import { LuTrendingUp } from "react-icons/lu";

const FantasyPoints = () => {
  const { t } = useTranslation();
  const { user } = useSelector(s => s.user);
  const { season } = useFantasySeason();
  const { data: team } = useMyTeam(season?.id);
  const { data: myPoints } = useMyPoints({ seasonId: season?.id, teamId: team?.id });
  const { data: board } = useLeaderboard({ seasonId: season?.id, limit: 20 });
  const [tab, setTab] = useState("me");

  const squadPlayerIds = (team?.squad ?? []).map(s => s.player_id);
  const { data: pstats } = usePlayerGameweekPoints({
    seasonId: season?.id,
    playerIds: squadPlayerIds,
  });

  // Top performers this season across all fantasy players
  const { data: topPlayersData } = useFantasyPlayers({
    seasonId: season?.id,
    apiLeagueId: season?.comp?.api_league_id,
    sort: "points",
    limit: 15,
    enabled: !!season,
  });

  const myTotal = (myPoints ?? []).reduce((a, p) => a + Number(p.points ?? 0), 0);
  const bestGw = (myPoints ?? []).reduce(
    (a, p) => Math.max(a, Number(p.points ?? 0)), 0,
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[
          ["me", t("Mes points")],
          ["players", t("Top joueurs")],
          ["board", t("Classement")],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              tab === k
                ? "bg-emerald-600 text-white"
                : "bg-emerald-950/60 text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "me" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              [t("Total"), myTotal],
              [t("Meilleure journée"), bestGw],
              [t("Jouées"), (myPoints ?? []).length],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-emerald-950/60 p-4 text-center">
                <p className="text-2xl font-bold text-gray-100">{v}</p>
                <p className="text-xs text-gray-500 font-bold">{l}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-emerald-950/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="px-5 py-3">{t("Journée")}</th>
                  <th className="px-5 py-3 text-right">{t("Points")}</th>
                  <th className="px-5 py-3 text-right">{t("Rang GW")}</th>
                  <th className="px-5 py-3 text-right">{t("Rang global")}</th>
                </tr>
              </thead>
              <tbody>
                {(myPoints ?? []).map(g => (
                  <tr key={g.id}>
                    <td className="px-5 py-2.5 font-bold text-gray-100">GW {g.gw}</td>
                    <td className="px-5 py-2.5 text-right font-bold text-emerald-400">
                      {g.points}
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-500">
                      {g.rank_gw ? `#${g.rank_gw}` : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-500">
                      {g.rank_overall ? `#${g.rank_overall}` : "—"}
                    </td>
                  </tr>
                ))}
                {!myPoints?.length && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                      {t("Aucun point pour le moment — la saison n'a pas encore commencé.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Player points detail */}
          {pstats?.length > 0 && (
            <div className="rounded-2xl bg-emerald-950/60 p-4">
              <h3 className="font-bold text-gray-100 mb-3 flex items-center gap-2">
                <LuTrendingUp className="text-emerald-500" /> {t("Points par joueur")}
              </h3>
              <div className="space-y-1.5">
                {squadPlayerIds.map(pid => {
                  const rows = (pstats ?? []).filter(s => s.player_id === pid);
                  const pts = rows.reduce((a, r) => a + Number(r.points), 0);
                  const p = (team?.squad ?? []).find(s => s.player_id === pid)?.fantasy_players;
                  if (!pts) return null;
                  return (
                    <div key={pid} className="flex items-center gap-3 text-sm">
                      <PositionBadge position={p?.position} className="!w-6 !h-6 text-[10px]" />
                      <span className="flex-1 font-semibold text-gray-200 truncate">
                        {p?.name}
                      </span>
                      <span className="font-bold text-emerald-400">{pts} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "players" && (
        <div className="rounded-2xl bg-emerald-950/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">{t("Joueur")}</th>
                <th className="px-5 py-3">{t("Club")}</th>
                <th className="px-5 py-3 text-right">{t("Prix")}</th>
                <th className="px-5 py-3 text-right">{t("Points")}</th>
              </tr>
            </thead>
            <tbody>
              {(topPlayersData?.players ?? []).map((p, i) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5 font-bold text-gray-400">{i + 1}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/5 overflow-hidden shrink-0">
                        {p.photo && <img src={p.photo} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-bold text-gray-100">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-gray-500 text-xs">{p.club_name}</td>
                  <td className="px-5 py-2.5 text-right font-bold">£{Number(p.price).toFixed(1)}m</td>
                  <td className="px-5 py-2.5 text-right font-bold text-emerald-400">
                    {p.totalPoints ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "board" && (
        <div className="rounded-2xl bg-emerald-950/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">{t("Manager")}</th>
                <th className="px-5 py-3 text-right">{t("Points")}</th>
              </tr>
            </thead>
            <tbody>
              {(board ?? []).map((row, i) => {
                const teamRow = row.fantasy_teams;
                const isMe = String(teamRow?.user_id) === String(user?.id);
                return (
                  <tr key={row.team_id} className={`${isMe ? "bg-emerald-500/10" : ""}`}>
                    <td className="px-5 py-2.5 font-bold text-gray-400">{i + 1}</td>
                    <td className="px-5 py-2.5 font-bold text-gray-100">
                      {teamRow?.name}
                      {isMe && <span className="ml-2 text-[10px] font-bold text-emerald-400">{t("Vous")}</span>}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-emerald-400">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
              {!board?.length && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                    {t("Aucun classement pour le moment.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FantasyPoints;
