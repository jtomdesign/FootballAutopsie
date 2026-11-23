import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { usePostData } from "../hooks/usePostData";
import {
  useLiveFixtures,
  useFixturesByDate,
  useLeagues,
  useTopScorers,
} from "../hooks/football";
import { FEATURED_LEAGUES } from "../services/football/leagues";
import { todayParam, shiftDays } from "../services/football/endpoints";
import { formatMatchDay, formatDate } from "../utils/helpers";
import SectionHeader from "../components/football/SectionHeader";
import MatchList from "../components/football/MatchList";
import { MatchListSkeleton } from "../components/football/Skeleton";
import EmptyState from "../components/football/EmptyState";
import TeamLogo from "../components/football/TeamLogo";
import ScorerRow from "../components/football/ScorerRow";
import ImageDownloadButton from "../components/football/ImageDownloadButton";
import { HiArrowRight, HiBolt } from "react-icons/hi2";
import { RiTrophyFill } from "react-icons/ri";
import Spinner from "../ui/Spinner";
import AdBanner from "../components/AdBanner";

const categoryName = post => post?.Categories?.name ?? post?.Categories?.[0]?.name ?? null;

const NewsCard = ({ post, large = false }) => {
  const { t } = useTranslation();
  return (
  <Link
    to={`/news/${post.slug}`}
    className={`group block bg-emerald-950/70 border border-emerald-900/60 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors ${
      large ? "md:col-span-2 md:row-span-2" : ""
    }`}
  >
    <div
      className={`w-full ${large ? "h-72 md:h-96" : "h-40"} bg-emerald-900/40 bg-cover bg-center`}
      style={{
        backgroundImage: post.featuredImage
          ? `url(${post.featuredImage})`
          : undefined,
      }}
    />
    <div className="p-4">
      <div className="flex items-center gap-3 text-[0.65rem] uppercase tracking-wider text-gray-500 mb-2">
        {categoryName(post) && (
          <span className="text-emerald-400 font-bold">{categoryName(post)}</span>
        )}
        {post.isBreaking && (
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <HiBolt /> {t("À la une")}
          </span>
        )}
        <span>{formatDate(post.created_at)}</span>
        <span>{post.readingTime ?? "—"} min</span>
      </div>
      <h3
        className={`font-serif text-gray-50 group-hover:text-emerald-400 transition-colors leading-snug ${
          large ? "text-2xl md:text-3xl" : "text-lg"
        }`}
      >
        {post.title}
      </h3>
      {!large && post.excerpt && (
        <p className="text-gray-400 text-sm mt-2 line-clamp-2">{post.excerpt}</p>
      )}
    </div>
  </Link>
  );
};

const BreakingBar = ({ posts }) => {
  const { t } = useTranslation();
  // Show breaking news; fall back to the latest headlines so the bar
  // always has content.
  const items = posts.slice(0, 8);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;
  const current = items[index % items.length];

  return (
    <div className="bg-emerald-950/60 border-b border-emerald-900/60 sticky top-20 z-40 backdrop-blur-sm">
      <Container>
        <div className="flex items-center gap-4 py-2.5 overflow-hidden">
          <span className="shrink-0 flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase tracking-widest">
            <HiBolt className="animate-pulse text-emerald-500" /> {t("Flash")}
          </span>
          <div className="relative flex-1 min-w-0 h-6">
            <Link
              key={current.id}
              to={`/news/${current.slug}`}
              className="fa-flash-item absolute inset-0 flex items-center text-sm text-gray-300 hover:text-emerald-400 transition-colors truncate"
            >
              {current.title}
            </Link>
          </div>
          {items.length > 1 && (
            <div className="shrink-0 flex items-center gap-1.5">
              {items.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Flash ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === index % items.length
                      ? "w-5 bg-emerald-500"
                      : "w-1.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

const WeekendResultsBar = () => {
  const { t } = useTranslation();
  const today = todayParam();
  // Big-matchday results strip: Mondays (after the weekend) and
  // Thursdays (after Champions League Tue/Wed fixtures).
  // UTC day — fixture dates are UTC, so this matches the data window.
  const day = new Date().getUTCDay();
  const isMatchday = day === 1 || day === 4;
  const d1 = useFixturesByDate(shiftDays(today, -1), isMatchday);
  const d2 = useFixturesByDate(shiftDays(today, -2), isMatchday);
  const d3 = useFixturesByDate(shiftDays(today, -3), isMatchday);

  const featuredIds = new Set(FEATURED_LEAGUES.map(l => l.id));
  const results = [d1.data, d2.data, d3.data]
    .flat()
    .filter(f => f?.status?.isFinished && featuredIds.has(f.league?.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!isMatchday || !results.length) return null;

  return (
    <div className="bg-emerald-950/60 border-b border-emerald-900/60">
      <Container>
        <div className="flex items-center gap-3 py-2 overflow-hidden">
          <span className="shrink-0 flex items-center text-emerald-500" title={t("Grands résultats")}>
            <RiTrophyFill className="text-base" />
          </span>
          <div className="overflow-hidden flex-1">
            <div className="marquee-track marquee-slow flex gap-2.5">
              {[...results, ...results].map((f, i) => (
                <Link
                  key={`${f.id}-${i}`}
                  to={`/match/${f.id}`}
                  className="shrink-0 flex items-center gap-2 bg-emerald-900/40 hover:bg-emerald-900/70 rounded-full pl-2 pr-3 py-1.5 transition-colors"
                >
                  <TeamLogo logo={f.league.logo} name={f.league.name} size="w-4 h-4" />
                  <TeamLogo logo={f.homeTeam.logo} name={f.homeTeam.name} size="w-4 h-4" />
                  <span className="text-xs text-gray-300 whitespace-nowrap">
                    {f.homeTeam.name}{" "}
                    <span className="font-bold text-gray-100 tabular-nums">
                      {f.goals.home ?? 0} - {f.goals.away ?? 0}
                    </span>{" "}
                    {f.awayTeam.name}
                  </span>
                  <TeamLogo logo={f.awayTeam.logo} name={f.awayTeam.name} size="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const scorerCardRefs = React.useRef({});
  const { data: posts = [], isLoading: postsLoading } = usePostData();
  const { data: allLive = [], isLoading: liveLoading } = useLiveFixtures();
  const today = todayParam();
  const { data: allToday = [], isLoading: todayLoading } =
    useFixturesByDate(today);

  // Home only surfaces the top competitions, not every fixture worldwide
  const featuredIds = new Set(FEATURED_LEAGUES.map(l => l.id));
  const todayFixtures = allToday.filter(f => featuredIds.has(f.league?.id));
  // Live matches are shown regardless of competition — the list is small
  const live = allLive;

  const { data: allLeagues = [] } = useLeagues();
  const leagueById = Object.fromEntries(allLeagues.map(l => [l.id, l]));
  const featuredLeagues = FEATURED_LEAGUES.map(f => leagueById[f.id]).filter(
    Boolean,
  );
  const scorerLeagues = [39, 140, 61]; // PL, La Liga, Ligue 1
  const scorersQueries = [
    useTopScorers({ league: 39 }),
    useTopScorers({ league: 140 }),
    useTopScorers({ league: 61 }),
  ];

  const published = posts ?? [];
  const [featured] = published;
  const breaking = published.filter(p => p.isBreaking);
  const latest = published.slice(1, 3);

  if (postsLoading) return <Spinner />;

  return (
    <div className="pb-16">
      <BreakingBar posts={breaking.length ? breaking : published.slice(0, 5)} />
      <WeekendResultsBar />

      <Container>
        {/* Hero news */}
        <section className="mt-6">
          <SectionHeader
            title={t("Actualités")}
            subtitle={t("Toute l'actualité football")}
            action={
              <Link
                to="/news"
                className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:text-emerald-700"
              >
                {t("Tout voir")} <HiArrowRight />
              </Link>
            }
          />
          {published.length ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 fa-stagger">
              {featured && <NewsCard post={featured} large />}
              {latest.map(p => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("Aucun article publié")}
              message={t("Les prochains articles de Football Autopsie apparaîtront ici.")}
            />
          )}
        </section>

        {/* Featured competitions */}
        {featuredLeagues.length > 0 && (
          <section className="mt-10">
            <SectionHeader
              title={t("Compétitions")}
              subtitle={t("Les plus grandes championnats")}
              action={
                <Link
                  to="/ligues"
                  className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:text-emerald-700"
                >
                  {t("Toutes")} <HiArrowRight />
                </Link>
              }
            />
            <div className="overflow-hidden -mx-1 px-1">
              <div className="marquee-track flex gap-3 pb-2">
                {[...featuredLeagues, ...featuredLeagues].map((l, i) => (
                  <Link
                    key={`${l.id}-${i}`}
                    to={`/ligues/${l.id}`}
                    className="shrink-0 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 hover:bg-[#ecfdf5] transition-colors min-w-52"
                  >
                    <TeamLogo logo={l.logo} name={l.name} size="w-10 h-10" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">
                        {l.name}
                      </p>
                      <p className="text-[0.65rem] text-gray-500 truncate">
                        {l.country}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <AdBanner variant="leaderboard" className="mt-10" />

        {/* Live + today */}
        <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SectionHeader
              title={t("En direct")}
              subtitle={t("Matchs en cours")}
              action={
                <Link
                  to="/scores"
                  className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:text-emerald-700"
                >
                  {t("Scores")} <HiArrowRight />
                </Link>
              }
            />
            {liveLoading ? (
              <MatchListSkeleton rows={3} />
            ) : live.length ? (
              <MatchList fixtures={live} showLeague />
            ) : (
              <EmptyState
                title={t("Aucun match en direct")}
                message={t("Revenez plus tard pour suivre les matchs en direct.")}
              />
            )}
          </div>
          <div>
            <SectionHeader
              title={t("Aujourd'hui")}
              subtitle={formatMatchDay(new Date(), t)}
              action={
                <Link
                  to="/matchs"
                  className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:text-emerald-700"
                >
                  {t("Tous les matchs")} <HiArrowRight />
                </Link>
              }
            />
            {todayLoading ? (
              <MatchListSkeleton rows={4} />
            ) : todayFixtures.length ? (
              <MatchList fixtures={todayFixtures} showLeague />
            ) : (
              <EmptyState
                title={t("Aucun match aujourd'hui")}
                message={t("Consultez le calendrier complet des matchs.")}
              />
            )}
          </div>
        </section>

        {/* Top scorers */}
        <section className="mt-12">
          <SectionHeader
            title={t("Meilleurs buteurs")}
            subtitle={t("Top buteurs des grands championnats")}
            action={
              <Link
                to="/ligues"
                className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:text-emerald-700"
              >
                {t("Compétitions")} <HiArrowRight />
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fa-stagger">
            {scorerLeagues.map((leagueId, i) => {
              const league = leagueById[leagueId];
              const scorers = scorersQueries[i]?.data ?? [];
              return (
                <div
                  key={leagueId}
                  ref={el => (scorerCardRefs.current[leagueId] = el)}
                  className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden"
                >
                  <div className="flex items-stretch bg-emerald-900/40 border-b border-emerald-900/60">
                    <Link
                      to={`/ligues/${leagueId}`}
                      className="flex items-center gap-2 px-4 py-2.5 flex-1 min-w-0 hover:bg-emerald-900/60 transition-colors"
                    >
                      <TeamLogo
                        logo={league?.logo}
                        name={league?.name ?? ""}
                        size="w-5 h-5"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 truncate">
                        {league?.name ?? t("Championnat")}
                      </span>
                    </Link>
                    <div className="flex items-center pr-2">
                      <ImageDownloadButton
                        getNode={() => scorerCardRefs.current[leagueId]}
                        filename={`top-buteurs-${leagueId}`}
                        iconOnly
                        className="!px-2 !py-1 my-1"
                      />
                    </div>
                  </div>
                  {scorers.length ? (
                    scorers.slice(0, 5).map(e => (
                      <ScorerRow key={e.player.id} entry={e} metric="goals" />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm p-4 text-center">
                      {t("Aucune donnée")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </Container>
    </div>
  );
};



export default Home;
