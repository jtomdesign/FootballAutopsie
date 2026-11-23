import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { useFixturesByDate, useLeagues } from "../hooks/football";
import { todayParam, shiftDays } from "../services/football/endpoints";
import { formatMatchDay } from "../utils/helpers";
import SectionHeader from "../components/football/SectionHeader";
import MatchList from "../components/football/MatchList";
import { MatchListSkeleton } from "../components/football/Skeleton";
import EmptyState from "../components/football/EmptyState";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiSearchLine,
} from "react-icons/ri";

const STATUS_FILTERS = [
  { value: "all", labelKey: "Tous" },
  { value: "live", labelKey: "En direct" },
  { value: "upcoming", labelKey: "À venir" },
  { value: "finished", labelKey: "Terminés" },
  { value: "postponed", labelKey: "Reportés" },
];

const Fixtures = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(todayParam());
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: fixtures = [], isLoading } = useFixturesByDate(date);
  const { data: leagues = [] } = useLeagues();

  const filtered = useMemo(() => {
    let list = fixtures;
    if (leagueFilter !== "all") {
      list = list.filter(f => String(f.league?.id) === leagueFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter(f => {
        switch (statusFilter) {
          case "live":
            return f.status.isLive;
          case "upcoming":
            return f.status.isUpcoming;
          case "finished":
            return f.status.isFinished;
          case "postponed":
            return f.status.isPostponed;
          default:
            return true;
        }
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        f =>
          f.homeTeam.name.toLowerCase().includes(q) ||
          f.awayTeam.name.toLowerCase().includes(q) ||
          f.league.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [fixtures, leagueFilter, statusFilter, search]);

  const isToday = date === todayParam();

  return (
    <Container>
      <div className="py-8">
        <SectionHeader title={t("Matchs")} subtitle={t("Calendrier et résultats")} />

        {/* Date navigation */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setDate(shiftDays(date, -1))}
            className="p-2.5 rounded-full bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800/60 transition-colors cursor-pointer"
            aria-label={t("Jour précédent")}
          >
            <RiArrowLeftSLine className="text-xl" />
          </button>
          <button
            onClick={() => setDate(todayParam())}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors cursor-pointer ${
              isToday
                ? "bg-emerald-500 text-white"
                : "bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800/60"
            }`}
          >
            <RiCalendarLine />
            {isToday ? t("Aujourd'hui") : formatMatchDay(new Date(`${date}T12:00:00`))}
          </button>
          <button
            onClick={() => setDate(shiftDays(date, 1))}
            className="p-2.5 rounded-full bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800/60 transition-colors cursor-pointer"
            aria-label={t("Jour suivant")}
          >
            <RiArrowRightSLine className="text-xl" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("Rechercher une équipe ou une compétition…")}
              className="w-full pl-11 pr-4 py-2.5 rounded-full fa-input text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={leagueFilter}
            onChange={e => setLeagueFilter(e.target.value)}
            className="px-4 py-2.5 rounded-full fa-input text-sm text-gray-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">{t("Toutes les compétitions")}</option>
            {leagues.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.country ? ` — ${l.country}` : ""}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                  statusFilter === s.value
                    ? "bg-emerald-500 text-white"
                    : "fa-tab-inactive bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                }`}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <MatchListSkeleton rows={8} />
        ) : filtered.length ? (
          <MatchList fixtures={filtered} showLeague />
        ) : (
          <EmptyState
            title={t("Aucun match")}
            message={t("Aucun match ne correspond à ces critères pour cette date.")}
          />
        )}
      </div>
    </Container>
  );
};

export default Fixtures;
