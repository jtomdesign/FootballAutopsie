import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { supabase } from "../services/supabase";
import {
  useTeamSearch,
  usePlayerProfileSearch,
  useLeagueSearch,
} from "../hooks/football";
import {
  getFixturesByDate,
  todayParam,
  shiftDays,
} from "../services/football/endpoints";
import SectionHeader from "../components/football/SectionHeader";
import { useSEO } from "../utils/seo";
import MatchList from "../components/football/MatchList";
import TeamLogo from "../components/football/TeamLogo";
import EmptyState from "../components/football/EmptyState";
import { formatDate } from "../utils/helpers";
import { RiSearchLine } from "react-icons/ri";

const useDebounced = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const ResultGroup = ({ title, children, empty }) => {
  const { t } = useTranslation();
  return (
  <section className="mb-8">
    <h2 className="text-lg font-black uppercase tracking-wider text-emerald-400 mb-3">
      {title}
    </h2>
    {children ?? (
      <p className="text-gray-600 text-sm">{empty ?? t("Aucun résultat")}</p>
    )}
  </section>
  );
};

const Search = () => {
  const { t } = useTranslation();
  useSEO({
    title: "Recherche",
    path: "/recherche",
    noindex: true,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("q") ?? "");
  const query = useDebounced(input.trim());

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (query) next.set("q", query);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const enabled = query.length >= 2;

  // News
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["search-articles", query],
    enabled,
    queryFn: async () => {
      const { data } = await supabase
        .from("Posts")
        .select("id, title, slug, excerpt, created_at, featuredImage, Categories(name)")
        .eq("status", "published")
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: teams = [] } = useTeamSearch({ search: enabled ? query : undefined });
  const { data: players = [] } = usePlayerProfileSearch({ search: enabled ? query : undefined });
  const { data: leagues = [] } = useLeagueSearch({ search: enabled ? query : undefined });

  // Match search: scan a 10-day window (3 days back, 7 ahead) so recent
  // results, live games and upcoming fixtures all appear. Queries only run
  // while a search is active.
  const today = todayParam();
  const searchDates = React.useMemo(() => {
    const dates = [];
    for (let i = -3; i <= 7; i++) dates.push(shiftDays(today, i));
    return dates;
  }, [today]);

  const fixtureQueries = useQueries({
    queries: searchDates.map(date => ({
      queryKey: ["football", "fixtures", "date", date],
      queryFn: () => getFixturesByDate(date),
      staleTime: 5 * 60 * 1000,
      enabled,
      retry: 1,
    })),
  });
  const fixturesLoading = enabled && fixtureQueries.some(x => x.isLoading);

  const q = query.toLowerCase();
  const teamIds = new Set(teams.map(t => t.id));
  const leagueIds = new Set(leagues.map(l => l.id));
  const matchFixtures = enabled
    ? fixtureQueries
        .flatMap(x => x.data ?? [])
        .filter(
          f =>
            teamIds.has(f.homeTeam?.id) ||
            teamIds.has(f.awayTeam?.id) ||
            leagueIds.has(f.league?.id) ||
            f.homeTeam?.name?.toLowerCase().includes(q) ||
            f.awayTeam?.name?.toLowerCase().includes(q) ||
            f.league?.name?.toLowerCase().includes(q),
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  const hasAny =
    articles.length ||
    teams.length ||
    players.length ||
    leagues.length ||
    matchFixtures.length;

  return (
    <Container>
      <div className="py-8 max-w-4xl mx-auto">
        <SectionHeader title={t("Recherche")} subtitle={t("Actualités, équipes, joueurs, compétitions et matchs")} />

        <div className="relative mb-8">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-lg" />
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t("Rechercher…")}
            className="w-full pl-12 pr-4 py-3.5 rounded-full fa-input text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 text-lg"
          />
        </div>

        {!enabled && (
          <EmptyState
            title={t("Que recherchez-vous ?")}
            message={t("Saisissez au moins 2 caractères pour chercher dans toute la plateforme.")}
          />
        )}

        {enabled && !hasAny && !articlesLoading && !fixturesLoading && (
          <EmptyState
            title={t("Aucun résultat")}
            message={t("Aucun résultat pour « {{q}} ».", { q: query })}
          />
        )}

        {enabled && (
          <>
            <ResultGroup title={t("Actualités")}>
              {articlesLoading ? (
                <p className="text-gray-500 text-sm">{t("Recherche…")}</p>
              ) : articles.length ? (
                <div className="flex flex-col gap-3">
                  {articles.map(a => (
                    <Link
                      key={a.id}
                      to={`/news/${a.slug}`}
                      className="flex gap-4 bg-emerald-950/60 border border-emerald-900/60 rounded-xl p-3 hover:border-emerald-500/50 transition-colors"
                    >
                      <div
                        className="w-20 h-16 rounded-lg bg-emerald-900/40 bg-cover bg-center shrink-0"
                        style={{
                          backgroundImage: a.featuredImage
                            ? `url(${a.featuredImage})`
                            : undefined,
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-emerald-400 text-[0.65rem] font-bold uppercase">
                          {a.Categories?.name ?? "News"}
                        </p>
                        <p className="text-gray-100 font-semibold text-sm truncate">
                          {a.title}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {formatDate(a.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </ResultGroup>

            <ResultGroup title={t("Matchs")}>
              {fixturesLoading ? (
                <p className="text-gray-500 text-sm">{t("Recherche…")}</p>
              ) : matchFixtures.length ? (
                <MatchList fixtures={matchFixtures.slice(0, 10)} showLeague />
              ) : null}
            </ResultGroup>

            <ResultGroup title={t("Compétitions")}>
              {leagues.length ? (
                <div className="flex flex-wrap gap-2">
                  {leagues.slice(0, 12).map(l => (
                    <Link
                      key={l.id}
                      to={`/ligues/${l.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-800 text-xs text-gray-200 hover:border-emerald-500 transition-colors"
                    >
                      <TeamLogo logo={l.logo} name={l.name} size="w-4 h-4" />
                      {l.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </ResultGroup>

            <ResultGroup title={t("Équipes")}>
              {teams.length ? (
                <div className="flex flex-wrap gap-2">
                  {teams.slice(0, 12).map(tm => (
                    <Link
                      key={tm.id}
                      to={`/equipes/${tm.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-800 text-xs text-gray-200 hover:border-emerald-500 transition-colors"
                    >
                      <TeamLogo logo={tm.logo} name={tm.name} size="w-4 h-4" />
                      {tm.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </ResultGroup>

            <ResultGroup title={t("Joueurs")}>
              {players.length ? (
                <div className="flex flex-wrap gap-2">
                  {players.slice(0, 12).map(p => (
                    <Link
                      key={p.id}
                      to={`/joueurs/${p.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-800 text-xs text-gray-200 hover:border-emerald-500 transition-colors"
                    >
                      <TeamLogo logo={p.photo} name={p.name} size="w-4 h-4" />
                      {p.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </ResultGroup>
          </>
        )}
      </div>
    </Container>
  );
};

export default Search;
