import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { useLeagues, useLeagueSearch } from "../hooks/football";
import { FEATURED_LEAGUES } from "../services/football/leagues";
import SectionHeader from "../components/football/SectionHeader";
import EmptyState from "../components/football/EmptyState";
import { CardGridSkeleton } from "../components/football/Skeleton";
import TeamLogo from "../components/football/TeamLogo";
import {
  LuSearch,
} from "react-icons/lu";
import { useSEO } from "../utils/seo";

const LeagueCard = ({ league }) => {
  const { t } = useTranslation();
  return (
  <Link
    to={`/ligues/${league.id}`}
    className="flex items-center gap-4 bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5 hover:border-emerald-500/50 hover:bg-emerald-900/30 transition-all group"
  >
    <TeamLogo logo={league.logo} name={league.name} size="w-12 h-12" />
    <div className="min-w-0">
      <h3 className="font-bold text-gray-100 group-hover:text-emerald-300 transition-colors truncate">
        {league.name}
      </h3>
      <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1.5">
        {league.flag && (
          <img
            src={league.flag}
            alt=""
            className="w-4 h-3 rounded-sm object-cover"
          />
        )}
        {league.country ?? league.type}
        {league.currentSeason
          ? ` · ${t("Saison {{year}}", { year: league.currentSeason })}`
          : ""}
      </p>
    </div>
  </Link>
  );
};

const INITIAL_COUNT = 36;

const Ligues = () => {
  const { t } = useTranslation();
  useSEO({
    title: "Compétitions de football — championnats et coupes",
    description: "Toutes les compétitions de football : Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Ligue des Champions et bien plus sur Football Autopsie.",
    path: "/ligues",
  });
  const { data: leagues = [], isLoading } = useLeagues();
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const showSearch = search.trim().length >= 2;
  const { data: apiSearch = [], isFetching: searching } = useLeagueSearch({
    search: showSearch ? search.trim() : undefined,
  });
  const searchResults = showSearch ? apiSearch.slice(0, 48) : [];

  const featuredIds = new Set(FEATURED_LEAGUES.map(l => l.id));
  const featured = leagues.filter(l => featuredIds.has(l.id));
  const rest = leagues.filter(l => !featuredIds.has(l.id));
  const visibleRest = showAll ? rest : rest.slice(0, INITIAL_COUNT);

  return (
    <Container>
      <div className="py-8">
        <SectionHeader level={1}
          title={t("Compétitions")}
          subtitle={t("Championnats et coupes suivis par Football Autopsie")}
        />

        <div className="relative max-w-md mb-8">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("Rechercher une compétition…")}
            className="w-full pl-11 pr-4 py-2.5 rounded-full fa-input text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {showSearch ? (
          searching ? (
            <CardGridSkeleton count={6} />
          ) : searchResults.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fa-stagger">
              {searchResults.map(l => (
                <LeagueCard key={l.id} league={l} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("Aucune compétition trouvée")}
              message={t("Essayez un autre nom de championnat ou de coupe.")}
            />
          )
        ) : isLoading ? (
          <CardGridSkeleton count={8} />
        ) : leagues.length ? (
          <>
            {featured.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">
                  {t("Top compétitions")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fa-stagger">
                  {featured.map(l => (
                    <LeagueCard key={l.id} league={l} />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">
                  {t("Toutes les compétitions")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fa-stagger">
                  {visibleRest.map(l => (
                    <LeagueCard key={l.id} league={l} />
                  ))}
                </div>
                {!showAll && rest.length > INITIAL_COUNT && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setShowAll(true)}
                      className="px-6 py-2.5 rounded-full border border-emerald-500/50 text-emerald-400 text-sm font-bold hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      {t("Voir toutes les compétitions ({{count}})", { count: rest.length })}
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <EmptyState
            title={t("Compétitions indisponibles")}
            message={t("La liste des compétitions n'a pas pu être chargée. Vérifiez votre connexion ou la configuration de l'API.")}
          />
        )}
      </div>
    </Container>
  );
};

export default Ligues;
