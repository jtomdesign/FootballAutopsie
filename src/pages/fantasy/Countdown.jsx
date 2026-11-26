import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuTimer, LuRadio } from "react-icons/lu";

const fmt = ms => {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}j ${h}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

/**
 * Deadline countdown + matchday status badge.
 * deadline: ISO string; gwStatus: gameweek status from DB.
 */
const DeadlineBadge = ({ deadline, gwStatus }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - now;
  const live = gwStatus === "live" || (ms <= 0 && gwStatus !== "completed");

  if (gwStatus === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 text-xs font-bold">
        {t("Journée terminée")}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
        live
          ? "bg-red-500/15 text-red-400"
          : ms < 30 * 60 * 1000
            ? "bg-amber-500/15 text-amber-400"
            : "bg-emerald-500/15 text-emerald-400"
      }`}
    >
      {live ? <LuRadio className="w-3.5 h-3.5 animate-pulse" /> : <LuTimer className="w-3.5 h-3.5" />}
      {live ? t("EN DIRECT") : `${t("Deadline")} ${fmt(ms)}`}
    </span>
  );
};

export default DeadlineBadge;
