import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  useFantasyComps,
  useFantasyPlayers,
  useLeaderboard,
  useMyTeam,
  useMyPoints,
} from "../../hooks/fantasy";
import { PositionBadge } from "./components";
import { LuChartSpline } from "react-icons/lu";

const StatCard = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-white border border-gray-200 p-4">
    <p className="text-xs font-bold uppercase text-gray-400">{label}</p>
    <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const FantasyStatistics = () => {
  const { t } = useTranslation();
  const { user } = useSelector(s => s.user);
  const { data: comps } = useFantasyComps();
  const season = useMemo(
    () =>
      (comps ?? [])
        .flatMap(c => (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })))
        .find(s => s.status === "active") ?? null,
    [comps],
  );
  const { data: team } = useMyTeam(season?.id);
  const { data: myPoints } = useMyPoints({ seasonId: season?.id, teamId: team?.id });
  const { data: board } = useLeaderboard({ seasonId: season?.id, limit: 100 });

  // Top players per position
  const { data: gks } = useFantasyPlayers({ seasonId: season?.id, position: "G", sort: "points", limit: 5, enabled: !!season });
  const { data: defs } = useFantasyPlayers({ seasonId: season?.id, position: "D", sort: "points", limit: 5, enabled: !!season });
  const { data: mids } = useFantasyPlayers({ seasonId: season?.id, position: "M", sort: "points", limit: 5, enabled: !!season });
  const { data: fwds } = useFantasyPlayers({ seasonId: season?.id, position: "F", sort: "points", limit: 5, enabled: !!season });

  const myPts = (myPoints ?? []).map(p => Number(p.points ?? 0));
  const total = myPts.reduce((a, b) => a + b, 0);
  const avg = myPts.length ? (total / myPts.length).toFixed(1) : 0;
  const best = myPts.length ? Math.max(...myPts) : 0;
  const rank = (board ?? []).findIndex(
    b => String(b.fantasy_teams?.user_id) === String(user?.id),
  );

  const PosTable = ({ title, players }) => (
    <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-black text-gray-900 text-sm">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {(players?.players ?? []).slice(0, 5).map((p, i) => (
            <tr key={p.id} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-2 w-6 font-black text-gray-400">{i + 1}</td>
              <td className="px-2 py-2 font-semibold text-gray-900 truncate max-w-[140px]">{p.name}</td>
              <td className="px-2 py-2 text-xs text-gray-500">{p.club_name}</td>
              <td className="px-4 py-2 text-right font-black text-emerald-600">{p.totalPoints ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5">
      <h2 className="font-black text-gray-900 flex items-center gap-2">
        <LuChartSpline className="text-emerald-600" /> {t("Statistiques Fantasy")}
      </h2>

      {team && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={t("Points totaux")} value={total} />
          <StatCard label={t("Moyenne / GW")} value={avg} />
          <StatCard label={t("Meilleure journée")} value={best} />
          <StatCard
            label={t("Rang global")}
            value={rank >= 0 ? `#${rank + 1}` : "—"}
            sub={`${board?.length ?? 0} ${t("managers")}`}
          />
        </div>
      )}

      {/* Weekly performance bars */}
      {myPts.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <h3 className="font-black text-gray-900 text-sm mb-3">{t("Performance par journée")}</h3>
          <div className="flex items-end gap-1.5 h-28">
            {myPts.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-gray-500">{p}</span>
                <div
                  className="w-full rounded-t bg-emerald-500"
                  style={{ height: `${Math.max(4, (p / Math.max(...myPts)) * 80)}px` }}
                />
                <span className="text-[10px] text-gray-400">GW{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PosTable title={t("Meilleurs GK")} players={gks} />
        <PosTable title={t("Meilleurs DF")} players={defs} />
        <PosTable title={t("Meilleurs MF")} players={mids} />
        <PosTable title={t("Meilleurs AT")} players={fwds} />
      </div>
    </div>
  );
};

export default FantasyStatistics;
