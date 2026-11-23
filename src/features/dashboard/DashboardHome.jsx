import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAllPosts } from "../../hooks/usePostData";
import { useCategories } from "../../hooks/useCategories";
import { getAnalyticsStats } from "../../services/analytics";
import { formatDate } from "../../utils/helpers";
import {
  RiBookOpenFill,
  RiDraftFill,
  RiCalendarCheckFill,
  RiAlarmWarningFill,
  RiStackFill,
  RiArrowRightSLine,
  RiEyeLine,
  RiUserLine,
  RiGlobalLine,
} from "react-icons/ri";
import Spinner from "../../ui/Spinner";
import EmptyState from "../../components/football/EmptyState";

const StatCard = ({ icon, label, value, to }) => (
  <Link
    to={to}
    className="bg-emerald-950/60 rounded-2xl p-5 flex items-center gap-4 hover:bg-emerald-900/50 transition-colors"
  >
    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold text-gray-100 tabular-nums">{value}</p>
      <p className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 truncate">
        {label}
      </p>
    </div>
  </Link>
);

const STATUS_STYLES = {
  published: "bg-emerald-500/15 text-emerald-600",
  draft: "bg-gray-500/15 text-gray-500",
  scheduled: "bg-blue-500/15 text-blue-600",
  unpublished: "bg-red-500/15 text-red-500",
};

const PERIODS = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "7 jours" },
  { key: "month", label: "28 jours" },
  { key: "year", label: "12 mois" },
];

const DashboardHome = () => {
  const { data: posts = [], isLoading } = useAllPosts();
  const { data: categories = [] } = useCategories();
  const { data: stats } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: getAnalyticsStats,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) return <Spinner />;

  const list = posts ?? [];
  const count = status => list.filter(p => p.status === status).length;
  const published = list
    .filter(p => p.status === "published")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);
  const breaking = list.filter(p => p.isBreaking).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-100">Vue d'ensemble</h1>
        <p className="text-sm text-gray-400 mt-1">
          Gestion éditoriale de Football Autopsie
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<RiBookOpenFill />}
          label="Articles publiés"
          value={count("published")}
          to="/dashboard/posts?status=published"
        />
        <StatCard
          icon={<RiDraftFill />}
          label="Brouillons"
          value={count("draft") + count("unpublished")}
          to="/dashboard/posts?status=draft"
        />
        <StatCard
          icon={<RiCalendarCheckFill />}
          label="Planifiés"
          value={count("scheduled")}
          to="/dashboard/posts?status=scheduled"
        />
        <StatCard
          icon={<RiAlarmWarningFill />}
          label="Breaking news"
          value={breaking}
          to="/dashboard/posts"
        />
      </div>

      {stats && (
        <div className="mb-6">
          <h2 className="font-bold text-gray-100 mb-3 flex items-center gap-2">
            <RiGlobalLine className="text-emerald-400" /> Audience
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {PERIODS.map(p => (
              <div
                key={p.key}
                className="bg-emerald-950/60 rounded-2xl p-4"
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                  {p.label}
                </p>
                <p className="text-2xl font-extrabold text-gray-100 tabular-nums mt-1 flex items-center gap-1.5">
                  <RiUserLine className="text-emerald-400 text-lg" />
                  {stats[p.key]?.visitors ?? 0}
                </p>
                <p className="text-[0.7rem] text-gray-400 mt-0.5 flex items-center gap-1">
                  <RiEyeLine /> {stats[p.key]?.views ?? 0} vues
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-emerald-950/60 rounded-2xl p-5">
              <h3 className="font-bold text-gray-100 text-sm mb-3">
                Pages les plus visitées
              </h3>
              {(stats.top_pages ?? []).length ? (
                <div className="flex flex-col">
                  {stats.top_pages.map((p, i) => (
                    <div
                      key={p.path}
                      className="flex items-center gap-3 py-2 border-b border-emerald-900/40 last:border-0 text-sm"
                    >
                      <span className="text-[0.65rem] font-bold text-gray-500 w-4">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-gray-200 font-medium">
                        {p.path}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums shrink-0">
                        {p.visitors} visitors · {p.views} vues
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Aucune donnée pour le moment — les stats commencent à
                  s'accumuler dès le prochain déploiement.
                </p>
              )}
            </div>
            <div className="bg-emerald-950/60 rounded-2xl p-5">
              <h3 className="font-bold text-gray-100 text-sm mb-3">
                Sources de trafic
              </h3>
              {(stats.top_referrers ?? []).length ? (
                <div className="flex flex-col">
                  {stats.top_referrers.map((r, i) => (
                    <div
                      key={r.referrer}
                      className="flex items-center gap-3 py-2 border-b border-emerald-900/40 last:border-0 text-sm"
                    >
                      <span className="text-[0.65rem] font-bold text-gray-500 w-4">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-gray-200 font-medium">
                        {r.referrer}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums shrink-0">
                        {r.views} vues
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucune donnée.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-emerald-950/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-100">Derniers articles publiés</h2>
            <Link
              to="/dashboard/posts"
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-400"
            >
              Tout voir <RiArrowRightSLine />
            </Link>
          </div>
          {published.length ? (
            <div className="flex flex-col">
              {published.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-3 border-b border-emerald-900/40 last:border-0"
                >
                  <img
                    src={p.featuredImage}
                    alt=""
                    className="w-14 h-10 object-cover rounded-lg bg-emerald-900/60 shrink-0"
                    onError={e => (e.target.style.display = "none")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-100 truncate">
                      {p.title}
                    </p>
                    <p className="text-[0.7rem] text-gray-400">
                      {formatDate(p.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase shrink-0 ${STATUS_STYLES[p.status] ?? "bg-gray-500/15 text-gray-500"}`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun article publié"
              message="Publiez votre premier article depuis la section Articles."
            />
          )}
        </div>

        <div className="bg-emerald-950/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-100 flex items-center gap-2">
              <RiStackFill className="text-emerald-400" /> Catégories
            </h2>
            <Link
              to="/dashboard/categories"
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-400"
            >
              Gérer <RiArrowRightSLine />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span
                key={c.id}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: c.color || "#10b981" }}
              >
                {c.name}
              </span>
            ))}
            {!categories.length && (
              <p className="text-sm text-gray-400">
                Aucune catégorie pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
