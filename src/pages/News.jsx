import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { usePostData } from "../hooks/usePostData";
import { useCategories } from "../hooks/useCategories";
import { useFavorites } from "../hooks/user";
import { Link, useSearchParams } from "react-router-dom";
import SectionHeader from "../components/football/SectionHeader";
import EmptyState from "../components/football/EmptyState";
import Spinner from "../ui/Spinner";
import { formatDate, localizePost } from "../utils/helpers";
import {
  LuSearch,
  LuArrowUpDown,
  LuLayoutGrid,
  LuListChecks,
} from "react-icons/lu";
import AdBanner from "../components/AdBanner";
import { useSEO } from "../utils/seo";
import i18n from "../i18n";

const categoryName = post =>
  post?.Categories?.name ?? post?.Categories?.[0]?.name ?? null;

const POST_META = post => (
  <div className="flex items-center gap-3 text-[0.65rem] uppercase tracking-wider text-gray-500">
    {categoryName(post) && (
      <span className="text-emerald-400 font-bold">{categoryName(post)}</span>
    )}
    <span className="normal-case text-[0.6rem] tracking-normal">{formatDate(post.created_at)}</span>
    <span>{post.readingTime ?? "—"} min</span>
  </div>
);

const ArticleRow = ({ post }) => {
  const lp = localizePost(post);
  return (
  <Link
    to={`/news/${post.slug}`}
    className="flex gap-4 bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors group"
  >
    <div
      className="w-32 sm:w-44 shrink-0 aspect-[16/9] bg-emerald-900/40 bg-cover bg-center"
      style={{
        backgroundImage: post.featuredImage
          ? `url(${post.featuredImage})`
          : undefined,
      }}
    />
    <div className="py-4 pr-4 flex flex-col justify-center min-w-0">
      <div className="mb-1.5">{POST_META(post)}</div>
      <h3 className="font-serif text-gray-50 text-lg sm:text-xl leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
        {lp.title}
      </h3>
      {lp.excerpt && (
        <p className="text-gray-400 text-sm mt-1.5 line-clamp-2 hidden sm:block">
          {lp.excerpt}
        </p>
      )}
    </div>
  </Link>
  );
};

const NewsCard = ({ post }) => {
  const lp = localizePost(post);
  return (
  <Link
    to={`/news/${post.slug}`}
    className="flex flex-col bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors group"
  >
    <div
      className="aspect-[16/9] bg-emerald-900/40 bg-cover bg-center"
      style={{
        backgroundImage: post.featuredImage
          ? `url(${post.featuredImage})`
          : undefined,
      }}
    />
    <div className="p-4 flex flex-col gap-2 flex-1">
      <div>{POST_META(post)}</div>
      <h3 className="font-serif text-gray-50 text-lg leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
        {lp.title}
      </h3>
      {lp.excerpt && (
        <p className="text-gray-400 text-sm line-clamp-2">{lp.excerpt}</p>
      )}
    </div>
  </Link>
  );
};

const SORTS = {
  recent: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  az: (a, b) => (localizePost(a).title ?? "").localeCompare(localizePost(b).title ?? "", i18n.language?.startsWith("en") ? "en" : "fr"),
};

const selectCls =
  "fa-input appearance-none pl-4 pr-9 py-2.5 text-sm font-semibold cursor-pointer";

const News = () => {
  const { t } = useTranslation();
  useSEO({
    title: "Actualités football — News, transferts et analyses",
    description:
      "Toute l'actualité football sur Football Autopsie : news, transferts, analyses, résultats et faits marquants du football mondial.",
    path: "/news",
  });
  const { data: posts = [], isLoading } = usePostData();
  const { data: categories = [] } = useCategories();
  const { data: favorites = [] } = useFavorites();
  const { isAuthenticated } = useSelector(s => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categorie") || "all";
  const [feed, setFeed] = useState("all"); // all | foryou
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [layout, setLayout] = useState("list"); // list | grid

  const favNames = favorites
    .map(f => f.entity_name?.toLowerCase())
    .filter(Boolean);
  const matchesFav = p => {
    const lp = localizePost(p);
    const text = `${lp.title ?? ""} ${lp.excerpt ?? ""}`.toLowerCase();
    return favNames.some(n => text.includes(n));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = posts;
    if (activeCategory !== "all")
      list = list.filter(p => String(p.categoryId) === activeCategory);
    if (feed === "foryou") list = list.filter(matchesFav);
    if (q)
      list = list.filter(p =>
        `${localizePost(p).title ?? ""} ${localizePost(p).excerpt ?? ""}`.toLowerCase().includes(q),
      );
    return [...list].sort(SORTS[sort] ?? SORTS.recent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, activeCategory, feed, query, sort, favorites]);

  // Pagination — show 10 at a time, auto-load more on scroll
  const [visible, setVisible] = useState(10);
  const filterKey = `${activeCategory}|${feed}|${query}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisible(10);
  }

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setVisible(v => v + 10);
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, visible]);

  const setCategory = slug => {
    const next = new URLSearchParams(searchParams);
    if (slug === "all") next.delete("categorie");
    else next.set("categorie", slug);
    setSearchParams(next);
  };

  if (isLoading) return <Spinner />;

  return (
    <Container>
      <div className="py-8 max-w-7xl mx-auto">
        <SectionHeader level={1} title={t("News")} subtitle={t("Toute l'actualité Football Autopsie")} />

        <AdBanner variant="leaderboard" className="mb-6" />

        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("Rechercher un article…")}
              className="fa-input w-full pl-11 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            {isAuthenticated && favNames.length > 0 && (
              <button
                onClick={() => setFeed(feed === "foryou" ? "all" : "foryou")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                  feed === "foryou"
                    ? "bg-emerald-600 text-white"
                    : "fa-input hover:bg-emerald-500/10"
                }`}
              >
                {t("Pour vous")}
              </button>
            )}
            <div className="relative">
              <select
                value={activeCategory}
                onChange={e => setCategory(e.target.value)}
                className={selectCls}
                aria-label={t("Catégorie")}
              >
                <option value="all">{t("Toutes catégories")}</option>
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <LuArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className={selectCls}
                aria-label={t("Trier par")}
              >
                <option value="recent">{t("Plus récents")}</option>
                <option value="oldest">{t("Plus anciens")}</option>
                <option value="az">{t("Titre A → Z")}</option>
              </select>
              <LuArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>
            <div className="flex rounded-xl overflow-hidden fa-input !p-0">
              <button
                onClick={() => setLayout("list")}
                className={`px-3.5 cursor-pointer transition-colors ${
                  layout === "list"
                    ? "bg-emerald-600 text-white"
                    : "text-gray-400 hover:text-gray-100"
                }`}
                title={t("Vue liste")}
                aria-label={t("Vue liste")}
              >
                <LuListChecks className="text-base" />
              </button>
              <button
                onClick={() => setLayout("grid")}
                className={`px-3.5 cursor-pointer transition-colors ${
                  layout === "grid"
                    ? "bg-emerald-600 text-white"
                    : "text-gray-400 hover:text-gray-100"
                }`}
                title={t("Vue grille")}
                aria-label={t("Vue grille")}
              >
                <LuLayoutGrid className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {filtered.length ? (
          layout === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fa-stagger">
              {shown.map(post => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4 fa-stagger">
              {shown.map(post => (
                <ArticleRow key={post.id} post={post} />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            title={t("Aucun article")}
            message={t("Aucun article ne correspond à ce filtre pour le moment.")}
          />
        )}

        {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
      </div>
    </Container>
  );
};

export default News;
