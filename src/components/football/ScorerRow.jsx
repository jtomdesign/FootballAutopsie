import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeamLogo from "./TeamLogo";

const ScorerRow = ({ entry, metric = "goals" }) => {
  const { t } = useTranslation();
  const stat = entry.statistics?.[0] ?? {};
  const goals = stat.goals ?? {};
  const assists = stat.goals?.assists ?? 0;
  const apps = stat.games?.appearences ?? null;
  return (
    <Link
      to={`/joueurs/${entry.player.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#ecfdf5] transition-colors border-b border-emerald-900/40 last:border-0"
    >
      <TeamLogo logo={entry.player.photo} name={entry.player.name} size="w-9 h-9" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100 truncate">
          {entry.player.name}
        </p>
        <p className="text-[0.65rem] text-gray-500 truncate">
          {entry.player.nationality}
        </p>
      </div>
      <div className="text-right">
        <p className="text-emerald-400 font-semibold tabular-nums">
          {metric === "goals" ? goals.total ?? 0 : assists}
        </p>
        <p className="text-[0.6rem] text-gray-500 uppercase">
          {metric === "goals" ? t("buts") : t("passes")} ·{" "}
          {apps ?? "—"} {t("matchs")}
        </p>
      </div>
    </Link>
  );
};

export default ScorerRow;
