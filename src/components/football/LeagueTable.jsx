import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeamLogo from "./TeamLogo";
import ImageDownloadButton from "./ImageDownloadButton";

const FORM_COLORS = { W: "bg-emerald-500", D: "bg-gray-500", L: "bg-red-600" };

const VIEWS = [
  { id: "reduced", labelKey: "Réduit" },
  { id: "form", labelKey: "Forme" },
  { id: "full", labelKey: "Complet" },
];

const LeagueTable = ({ groups = [], compact = false, filename = "classement" }) => {
  const { t } = useTranslation();
  const [view, setView] = React.useState("reduced");
  const captureRef = React.useRef(null);
  if (!groups.length) return null;

  const tabs = compact ? VIEWS.filter(v => v.id !== "form") : VIEWS;

  // Mobile visibility per column. On sm+ every column is always visible.
  const stats = view === "full" ? "" : "hidden sm:table-cell"; // M V N D BP BC
  const form = compact
    ? "hidden"
    : view === "reduced"
      ? "hidden sm:table-cell"
      : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {/* Mobile view tabs */}
        <div className="sm:hidden flex items-center gap-2">
          {tabs.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors cursor-pointer ${
                view === v.id
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
              }`}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>
        <ImageDownloadButton
          getNode={() => captureRef.current}
          filename={filename}
          className="ml-auto"
        />
      </div>

      <div ref={captureRef} className="flex flex-col gap-6">
      {groups.map(group => (
        <div
          key={group.name}
          className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden"
        >
          {groups.length > 1 && (
            <div className="px-4 py-2.5 bg-emerald-900/40 border-b border-emerald-900/60 text-xs font-bold uppercase tracking-wider text-emerald-100">
              {group.name}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-0 sm:min-w-[640px]">
              <thead>
                <tr className="text-[0.65rem] uppercase tracking-wider text-gray-500 border-b border-emerald-900/60">
                  <th className="py-2.5 pl-4 text-left w-8">#</th>
                  <th className="text-left">{t("Club")}</th>
                  <th className="text-center">{t("M")}</th>
                  <th className={`text-center ${stats}`}>{t("V")}</th>
                  <th className={`text-center ${stats}`}>{t("N")}</th>
                  <th className={`text-center ${stats}`}>{t("D")}</th>
                  <th className={`text-center ${stats}`}>{t("BP")}</th>
                  <th className={`text-center ${stats}`}>{t("BC")}</th>
                  <th className="text-center">{t("+/-")}</th>
                  <th className="text-center pr-4">{t("Pts")}</th>
                  {!compact && <th className={`text-center pr-4 ${form}`}>{t("Forme")}</th>}
                </tr>
              </thead>
              <tbody>
                {group.rows.map(row => (
                  <tr
                    key={row.team.id}
                    className="border-b border-emerald-900/30 last:border-0 hover:bg-[#ecfdf5] transition-colors"
                  >
                    <td className="py-2.5 pl-4 text-gray-500 text-xs">
                      {row.rank}
                    </td>
                    <td className="py-2.5">
                      <Link
                        to={`/equipes/${row.team.id}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <TeamLogo
                          logo={row.team.logo}
                          name={row.team.name}
                          size="w-6 h-6"
                        />
                        <span className="text-gray-100 text-[0.85rem] group-hover:text-emerald-300 transition-colors truncate max-w-[7rem] sm:max-w-[12rem]">
                          {row.team.name}
                        </span>
                      </Link>
                    </td>
                    <td className="text-center text-gray-300 tabular-nums">
                      {row.played}
                    </td>
                    <td className={`text-center text-gray-300 tabular-nums ${stats}`}>
                      {row.win}
                    </td>
                    <td className={`text-center text-gray-300 tabular-nums ${stats}`}>
                      {row.draw}
                    </td>
                    <td className={`text-center text-gray-300 tabular-nums ${stats}`}>
                      {row.lose}
                    </td>
                    <td className={`text-center text-gray-300 tabular-nums ${stats}`}>
                      {row.goalsFor}
                    </td>
                    <td className={`text-center text-gray-300 tabular-nums ${stats}`}>
                      {row.goalsAgainst}
                    </td>
                    <td
                      className={`text-center tabular-nums ${
                        row.goalsDiff > 0
                          ? "text-emerald-400"
                          : row.goalsDiff < 0
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                    </td>
                    <td className="text-center pr-4 font-bold text-gray-50 tabular-nums">
                      {row.points}
                    </td>
                    {!compact && (
                      <td className={`text-center pr-4 ${form}`}>
                        <div className="flex gap-1 justify-center">
                          {(row.form ?? "")
                            .slice(-5)
                            .split("")
                            .map((r, i) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded-sm text-[0.55rem] font-bold text-white flex items-center justify-center ${FORM_COLORS[r] ?? "bg-gray-600"}`}
                              >
                                {r}
                              </span>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default LeagueTable;
