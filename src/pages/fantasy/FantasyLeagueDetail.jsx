import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useLeagueDetail,
  useLeagueTable,
  useMyTeam,
  useFantasyComps,
  useLeaveLeague,
  useGenerateH2H,
} from "../../hooks/fantasy";
import Button from "../../ui/Button";
import { LuLogOut, LuSwords, LuCrown } from "react-icons/lu";

const FantasyLeagueDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useSelector(s => s.user);
  const { data: league, isLoading, refetch } = useLeagueDetail(id);
  const { data: table } = useLeagueTable(id);
  const leave = useLeaveLeague();
  const genH2H = useGenerateH2H();
  const { data: comps } = useFantasyComps();
  const season = useMemo(
    () =>
      (comps ?? [])
        .flatMap(c => (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })))
        .find(s => String(s.id) === String(league?.season_id)) ?? null,
    [comps, league],
  );
  const { data: myTeam } = useMyTeam(league?.season_id);

  if (isLoading) return <p className="text-gray-500 py-10 text-center">{t("Chargement…")}</p>;
  if (!league) {
    return (
      <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-10 text-center text-gray-500">
        {t("Ligue introuvable ou privée.")}
      </div>
    );
  }

  const members = league.members ?? [];
  const myMember = members.find(
    m => String(m.fantasy_teams?.user_id) === String(user?.id),
  );
  const isOwner = String(league.owner_id) === String(user?.id);

  const h2hByGw = {};
  (league.h2h ?? []).forEach(f => {
    (h2hByGw[f.gw] ??= []).push(f);
  });
  const teamName = tid =>
    members.find(m => m.team_id === tid)?.fantasy_teams?.name ?? `#${tid}`;

  const doLeave = async () => {
    try {
      await leave.mutateAsync(league.id);
      toast.success(t("Vous avez quitté la ligue"));
      refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const doGenerate = async gw => {
    try {
      const n = await genH2H.mutateAsync({ leagueId: league.id, gw });
      toast.success(`${n} matchs générés`);
      refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-gray-100 p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/100/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{league.name}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {season?.comp?.name} · {season?.name} · {members.length} {t("membres")}
              {league.invite_code && ` · Code: ${league.invite_code}`}
            </p>
            {league.description && (
              <p className="text-gray-400 text-sm mt-2">{league.description}</p>
            )}
          </div>
          {myMember && (
            <Button name={t("Quitter")} type="white" icon={<LuLogOut />}
              onClick={doLeave} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Table */}
        <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
            <LuCrown className="text-amber-500" />
            <h3 className="font-bold text-gray-100">{t("Classement")}</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {(table ?? []).map((row, i) => {
                const isMe = String(row.user_id) === String(user?.id);
                return (
                  <tr key={row.team_id}
                    className={`border-b border-white/5 last:border-0 ${isMe ? "bg-emerald-500/10" : ""}`}>
                    <td className="px-5 py-2.5 w-10 font-bold text-gray-400">{i + 1}</td>
                    <td className="px-2 py-2.5 font-bold text-gray-100">
                      {row.name}
                      {isMe && <span className="ml-2 text-[10px] font-bold uppercase text-emerald-400">{t("Vous")}</span>}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-emerald-400">
                      {row.points} pts
                    </td>
                  </tr>
                );
              })}
              {!table?.length && (
                <tr><td className="px-5 py-8 text-center text-gray-400">{t("Aucun membre.")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Members */}
        <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-4">
          <h3 className="font-bold text-gray-100 mb-3">{t("Membres")}</h3>
          <div className="space-y-2">
            {members.map(m => {
              const isMe = String(m.fantasy_teams?.user_id) === String(user?.id);
              return (
                <div key={m.team_id}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 ${isMe ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10"}`}>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {(m.fantasy_teams?.name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <span className="flex-1 font-bold text-gray-100 text-sm truncate">
                    {m.fantasy_teams?.name}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {m.fantasy_teams?.total_points ?? 0} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* H2H fixtures */}
      {league.type === "h2h" && (
        <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-100 flex items-center gap-2">
              <LuSwords className="text-rose-500" /> {t("Matchs head-to-head")}
            </h3>
            {isOwner && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(gw => (
                  <button key={gw}
                    onClick={() => doGenerate(gw)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-emerald-500/15 hover:text-emerald-300"
                    title={`GW${gw}`}>
                    GW{gw}
                  </button>
                ))}
              </div>
            )}
          </div>
          {Object.keys(h2hByGw).length === 0 ? (
            <p className="text-sm text-gray-400">
              {isOwner
                ? t("Générez les matchs par journée avec les boutons GW ci-dessus.")
                : t("Le propriétaire générera les matchs.")}
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(h2hByGw).sort((a, b) => a[0] - b[0]).map(([gw, matches]) => (
                <div key={gw}>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-2">GW{gw}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {matches.map(m => {
                      const mine =
                        m.home_team_id === myTeam?.id || m.away_team_id === myTeam?.id;
                      return (
                        <div key={m.id}
                          className={`flex items-center justify-between rounded-xl border p-3 text-sm ${mine ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10"}`}>
                          <span className={`font-bold truncate ${m.home_team_id === myTeam?.id ? "text-emerald-300" : "text-gray-200"}`}>
                            {teamName(m.home_team_id)}
                          </span>
                          <span className="font-bold text-gray-400 px-2">
                            {m.home_points != null
                              ? `${m.home_points} – ${m.away_points}`
                              : "vs"}
                          </span>
                          <span className={`font-bold truncate text-right ${m.away_team_id === myTeam?.id ? "text-emerald-300" : "text-gray-200"}`}>
                            {teamName(m.away_team_id)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FantasyLeagueDetail;
