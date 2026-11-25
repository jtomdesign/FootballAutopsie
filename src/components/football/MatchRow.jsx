import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeamLogo from "./TeamLogo";
import { formatMatchDateTime, formatMatchDay } from "../../utils/helpers";

const ScoreOrTime = ({ fixture }) => {
  const { t } = useTranslation();
  const { status, goals } = fixture;

  if (status.isLive || status.isFinished) {
    const ht = goals.halftime;
    const hasHt = ht.home != null && ht.away != null;
    return (
      <div className="flex flex-col items-center min-w-20">
        <span
          className={`text-sm font-bold tabular-nums ${
            status.isLive ? "text-red-500" : "text-gray-100"
          }`}
        >
          {goals.home ?? 0} - {goals.away ?? 0}
        </span>
        {status.isLive && (
          <span className="text-[0.65rem] font-bold text-red-500 tabular-nums">
            {t(status.label)}
          </span>
        )}
        {hasHt && (
          <span className="text-[0.65rem] text-gray-500 tabular-nums">
            ({ht.home} - {ht.away})
          </span>
        )}
      </div>
    );
  }

  const isToday =
    new Date(fixture.date).toDateString() === new Date().toDateString();
  const subLabel =
    status.isUpcoming && !isToday
      ? formatMatchDay(fixture.date)
      : t(status.label);

  return (
    <div className="flex flex-col items-center min-w-20">
      <span className="text-sm font-semibold text-gray-300 tabular-nums">
        {formatMatchDateTime(fixture.date)}
      </span>
      <span className="text-[0.65rem] uppercase tracking-wide text-gray-500">
        {subLabel}
      </span>
    </div>
  );
};

const MatchRow = ({ fixture, showLeague = false }) => {
  const { homeTeam, awayTeam, league, status } = fixture;

  return (
    <Link
      to={`/match/${fixture.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#ecfdf5] transition-colors border-b border-emerald-900/40 last:border-b-0"
    >
      <div className="flex-1 flex items-center gap-3 min-w-0 justify-end">
        <span
          className={`truncate text-xs text-right ${
            status.isFinished && homeTeam.winner
              ? "text-gray-50 font-semibold"
              : "text-gray-300"
          }`}
        >
          {homeTeam.name}
        </span>
        <TeamLogo logo={homeTeam.logo} name={homeTeam.name} />
      </div>

      <ScoreOrTime fixture={fixture} />

      <div className="flex-1 flex items-center gap-3 min-w-0">
        <TeamLogo logo={awayTeam.logo} name={awayTeam.name} />
        <span
          className={`truncate text-xs ${
            status.isFinished && awayTeam.winner
              ? "text-gray-50 font-semibold"
              : "text-gray-300"
          }`}
        >
          {awayTeam.name}
        </span>
      </div>

      {showLeague && (
        <div className="hidden md:flex items-center gap-2 w-44 shrink-0">
          <TeamLogo logo={league.logo} name={league.name} size="w-5 h-5" />
          <span className="truncate text-[0.7rem] text-gray-400">
            {league.name}
          </span>
        </div>
      )}
    </Link>
  );
};

export default MatchRow;
