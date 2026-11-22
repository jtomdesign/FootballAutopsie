import React, { useState } from "react";
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
import { formatDate } from "../utils/helpers";
import { HiArrowRight } from "react-icons/hi2";
import AdBanner from "../components/AdBanner";

const categoryName = post =>
  post?.Categories?.name ?? post?.Categories?.[0]?.name ?? null;

const ArticleRow = ({ post }) => (
  <Link
    to={`/news/${post.slug}`}
    className="flex gap-4 bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors group"
  >
    <div
      className="w-32 sm:w-44 shrink-0 bg-emerald-900/40 bg-cover bg-center"
      style={{
        backgroundImage: post.featuredImage
          ? `url(${post.featuredImage})`
          : undefined,
      }}
    />
    <div className="py-4 pr-4 flex flex-col justify-center min-w-0">
      <div className="flex items-center gap-3 text-[0.65rem] uppercase tracking-wider text-gray-500 mb-1.5">
        {categoryName(post) && (
          <span className="text-emerald-400 font-bold">
            {categoryName(post)}
          </span>
        )}
        <span>{formatDate(post.created_at)}</span>
        <span>{post.readingTime ?? "—"} min</span>
      </div>
      <h3 className="font-serif text-gray-50 text-lg sm:text-xl leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-gray-400 text-sm mt-1.5 line-clamp-2 hidden sm:block">
          {post.excerpt}
        </p>
      )}
    </div>
  </Link>
);

const News = () => {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = usePostData();
  const { data: categories = [] } = useCategories();
  const { data: favorites = [] } = useFavorites();
  const { isAuthenticated } = useSelector(s => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categorie") || "all";
  const [feed, setFeed] = useState("all"); // all | foryou

  const favNames = favorites
    .map(f => f.entity_name?.toLowerCase())
    .filter(Boolean);
  const matchesFav = p => {
    const text = `${p.title ?? ""} ${p.excerpt ?? ""}`.toLowerCase();
    return favNames.some(n => text.includes(n));
  };

  const base =
    activeCategory === "all"
      ? posts
      : posts.filter(p => String(p.categoryId) === activeCategory);
  const filtered = feed === "foryou" ? base.filter(matchesFav) : base;

  const setCategory = slug => {
    const next = new URLSearchParams(searchParams);
    if (slug === "all") next.delete("categorie");
    else next.set("categorie", slug);
    setSearchParams(next);
  };

  if (isLoading) return <Spinner />;

  return (
    <Container>
      <div className="py-8">
        <SectionHeader title={t("News")} subtitle={t("Toute l'actualité Football Autopsie")} />

        <AdBanner variant="leaderboard" className="mb-6" />

        <div className="flex gap-2 flex-wrap mb-6">
          {isAuthenticated && favNames.length > 0 && (
            <button
              onClick={() => setFeed(feed === "foryou" ? "all" : "foryou")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                feed === "foryou"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
              }`}
            >
              {t("Pour vous")}
            </button>
          )}
          <button
            onClick={() => {
              setFeed("all");
              setCategory("all");
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
              activeCategory === "all" && feed === "all"
                ? "bg-emerald-500 text-white"
                : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
            }`}
          >
            {t("Tout")}
          </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(String(c.id))}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                  activeCategory === String(c.id)
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                }`}
              >
                {c.name}
              </button>
            ))}
        </div>

        {filtered.length ? (
          <div className="flex flex-col gap-4 fa-stagger">
            {filtered.map(post => (
              <ArticleRow key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("Aucun article")}
            message={t("Aucun article ne correspond à ce filtre pour le moment.")}
          />
        )}
      </div>
    </Container>
  );
};

export default News;
