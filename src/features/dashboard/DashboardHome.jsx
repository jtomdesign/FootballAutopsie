import React from "react";
import { Link } from "react-router-dom";
import { useAllPosts } from "../../hooks/usePostData";
import { useCategories } from "../../hooks/useCategories";
import { formatDate } from "../../utils/helpers";
import {
  RiBookOpenFill,
  RiDraftFill,
  RiCalendarCheckFill,
  RiAlarmWarningFill,
  RiStackFill,
  RiArrowRightSLine,
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

const DashboardHome = () => {
  const { data: posts = [], isLoading } = useAllPosts();
  const { data: categories = [] } = useCategories();

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
