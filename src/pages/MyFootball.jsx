import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { useSelector } from "react-redux";
import {
  useFavorites,
  useRemoveFavorite,
  useSavedArticles,
  useUnsaveArticle,
  useProfile,
  useUpdateProfile,
} from "../hooks/user";
import { useLiveFixtures, useFixturesByDate } from "../hooks/football";
import { usePostData } from "../hooks/usePostData";
import { todayParam, shiftDays } from "../services/football/endpoints";
import SectionHeader from "../components/football/SectionHeader";
import EmptyState from "../components/football/EmptyState";
import MatchList from "../components/football/MatchList";
import TeamLogo from "../components/football/TeamLogo";
import { CardGridSkeleton, MatchListSkeleton } from "../components/football/Skeleton";
import { formatDate, localizePost } from "../utils/helpers";
import {
  LuUserPlus,
  LuTrash2,
  LuPencil,
  LuSave,
  LuRadio,
} from "react-icons/lu";
import { useSEO } from "../utils/seo";

const FavoriteChip = ({ fav }) => {
  const { t } = useTranslation();
  const remove = useRemoveFavorite();
  const href =
    fav.entity_type === "team"
      ? `/equipes/${fav.entity_id}`
      : fav.entity_type === "player"
        ? `/joueurs/${fav.entity_id}`
        : fav.entity_type === "competition"
          ? `/ligues/${fav.entity_id}`
          : `/match/${fav.entity_id}`;
  return (
    <span className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full bg-emerald-900/40 text-sm text-gray-100">
      <TeamLogo logo={fav.entity_logo} name={fav.entity_name ?? "?"} size="w-5 h-5" />
      <Link to={href} className="font-medium hover:text-emerald-400 truncate max-w-40">
        {fav.entity_name ?? fav.entity_id}
      </Link>
      <button
        onClick={() => remove.mutate(fav.id)}
        className="text-gray-400 hover:text-red-500 cursor-pointer"
        aria-label={t("Retirer")}
      >
        <LuTrash2 />
      </button>
    </span>
  );
};

const FavoriteGroup = ({ title, type, empty }) => {
  const { data: favorites = [], isLoading } = useFavorites(type);
  if (isLoading) return <CardGridSkeleton count={2} />;
  return (
    <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
        <LuUserPlus className="text-emerald-600" /> {title}
        {favorites.length > 0 && (
          <span className="text-xs text-gray-400 font-normal">({favorites.length})</span>
        )}
      </h3>
      {favorites.length ? (
        <div className="flex flex-wrap gap-2">
          {favorites.map(f => (
            <FavoriteChip key={f.id} fav={f} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{empty}</p>
      )}
    </div>
  );
};

const ProfileCard = () => {
  const { t } = useTranslation();
  const { user } = useSelector(s => s.user);
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", avatar_url: "" });

  const startEdit = () => {
    setForm({
      username: profile?.username ?? "",
      full_name: profile?.full_name ?? "",
      avatar_url: profile?.avatar_url ?? user?.avatarUrl ?? "",
    });
    setEditing(true);
  };

  const save = () =>
    update.mutate(form, { onSuccess: () => setEditing(false) });

  const inputCls =
    "w-full px-3 py-2 rounded-xl bg-emerald-900/40 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";

  return (
    <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-100">{t("Mon profil")}</h3>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            <LuPencil /> {t("Modifier")}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            className={inputCls}
            placeholder={t("Nom d'utilisateur")}
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder={t("Nom complet")}
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder={t("URL de la photo de profil")}
            value={form.avatar_url}
            onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={save}
              disabled={update.isPending}
              className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {t("Enregistrer")}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-1.5 rounded-full fa-tab-inactive bg-emerald-500/10 text-emerald-700 text-xs font-semibold cursor-pointer"
            >
              {t("Annuler")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {profile?.avatar_url || user?.avatarUrl ? (
            <img
              src={profile?.avatar_url || user?.avatarUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-lg font-black">
              {(profile?.username || profile?.full_name || user?.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-100 truncate">
              {profile?.full_name || profile?.username || user?.name || t("Utilisateur")}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email}
              {profile?.username && profile?.full_name ? ` · @${profile.username}` : ""}
            </p>
            <p className="text-xs text-gray-400">
              {(user?.createdAt ?? profile?.created_at)
                ? t("Membre depuis {{date}}", {
                    date: formatDate(user?.createdAt ?? profile?.created_at),
                  })
                : "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SavedNews = () => {
  const { t } = useTranslation();
  const { data: saved = [], isLoading } = useSavedArticles();
  const unsave = useUnsaveArticle();
  const { data: posts = [] } = usePostData();
  const items = saved
    .map(s => ({ save: s, post: posts.find(p => p.id === s.post_id) }))
    .filter(x => x.post);

  if (isLoading) return <CardGridSkeleton count={2} />;
  return (
    <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
        <LuSave className="text-emerald-600" /> {t("Articles enregistrés")}
        {items.length > 0 && (
          <span className="text-xs text-gray-400 font-normal">({items.length})</span>
        )}
      </h3>
      {items.length ? (
        <ul className="flex flex-col divide-y divide-[#f0f0f0]">
          {items.slice(0, 8).map(({ save, post }) => (
            <li key={save.id} className="py-2.5 flex items-center gap-3">
              <Link
                to={`/news/${post.slug}`}
                className="flex-1 min-w-0 text-sm font-medium text-gray-100 hover:text-emerald-400 truncate"
              >
                {localizePost(post).title}
              </Link>
              <button
                onClick={() => unsave.mutate(save.id)}
                className="text-gray-400 hover:text-red-500 cursor-pointer shrink-0"
                aria-label={t("Retirer")}
              >
                <LuTrash2 />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">
          {t("Aucun article enregistré — utilisez le bouton « Enregistrer » sur un article.")}
        </p>
      )}
    </div>
  );
};

const SavedMatches = () => {
  const { t } = useTranslation();
  const { data: favorites = [] } = useFavorites("match");
  const upcoming = favorites.filter(f => f.entity_name);
  return (
    <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
        <LuRadio className="text-emerald-600" /> {t("Matchs suivis")}
        {upcoming.length > 0 && (
          <span className="text-xs text-gray-400 font-normal">({upcoming.length})</span>
        )}
      </h3>
      {upcoming.length ? (
        <ul className="flex flex-col divide-y divide-[#f0f0f0]">
          {upcoming.slice(0, 8).map(f => (
            <li key={f.id} className="py-2 flex items-center gap-2">
              <Link
                to={`/match/${f.entity_id}`}
                className="flex-1 text-sm font-medium text-gray-100 hover:text-emerald-400 truncate"
              >
                {f.entity_name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">
          {t("Aucun match suivi — utilisez « Suivre le match » sur une fiche match.")}
        </p>
      )}
    </div>
  );
};

const MyFootball = () => {
  useSEO({ title: "Mon espace", path: "/mon-espace", noindex: true });
  const { t } = useTranslation();
  const { user } = useSelector(s => s.user);
  const { data: favorites = [] } = useFavorites();
  const { data: live = [], isLoading: liveLoading } = useLiveFixtures();
  const today = todayParam();
  const { data: todayFx = [] } = useFixturesByDate(today);
  const { data: tomorrowFx = [] } = useFixturesByDate(shiftDays(today, 1));

  const favTeamIds = useMemo(
    () =>
      new Set(
        favorites
          .filter(f => f.entity_type === "team")
          .map(f => Number(f.entity_id)),
      ),
    [favorites],
  );
  const favMatchIds = useMemo(
    () =>
      new Set(
        favorites
          .filter(f => f.entity_type === "match")
          .map(f => String(f.entity_id)),
      ),
    [favorites],
  );

  const involvesFavorite = f =>
    favTeamIds.has(f.homeTeam?.id) ||
    favTeamIds.has(f.awayTeam?.id) ||
    favMatchIds.has(String(f.id));

  const liveFav = live.filter(involvesFavorite);
  const upcomingFav = [...todayFx, ...tomorrowFx].filter(
    f => involvesFavorite(f) && !f.status?.isLive && !f.status?.isFinished,
  );

  const hasFavorites = favorites.length > 0;

  return (
    <Container>
      <div className="py-8 max-w-5xl mx-auto">
        <SectionHeader
          title={t("Mon espace{{suffix}}", { suffix: user?.name ? `, ${user.name}` : "" })}
          subtitle={t("Vos équipes, matchs et contenus suivis")}
        />

        {!hasFavorites ? (
          <div className="mb-8">
            <EmptyState
              title={t("Personnalisez votre espace")}
              message={t("Suivez des équipes, compétitions, joueurs ou matchs pour voir vos matchs en direct et vos contenus ici.")}
            />
            <div className="flex justify-center gap-3 mt-4">
              <Link
                to="/equipes"
                className="px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                {t("Explorer les équipes")}
              </Link>
              <Link
                to="/ligues"
                className="px-5 py-2.5 rounded-full fa-tab-inactive bg-emerald-500/15 text-emerald-700 text-sm font-semibold hover:bg-emerald-500/25 transition-colors"
              >
                {t("Explorer les compétitions")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Live + upcoming followed matches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <LuRadio className="text-red-500" /> {t("Matchs en direct suivis")}
                </h3>
                {liveLoading ? (
                  <MatchListSkeleton rows={3} />
                ) : liveFav.length ? (
                  <MatchList fixtures={liveFav} showLeague />
                ) : (
                  <p className="text-sm text-gray-400">
                    {t("Aucun match suivi en cours.")}
                  </p>
                )}
              </div>
              <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-100 mb-3">
                  {t("Prochains matchs suivis")}
                </h3>
                {upcomingFav.length ? (
                  <MatchList fixtures={upcomingFav.slice(0, 8)} showLeague />
                ) : (
                  <p className="text-sm text-gray-400">
                    {t("Aucun match à venir pour vos favoris.")}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ProfileCard />
          <SavedMatches />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <FavoriteGroup
            title={t("Équipes suivies")}
            type="team"
            empty={t("Aucune équipe suivie — le bouton « Suivre » est sur chaque page équipe.")}
          />
          <FavoriteGroup
            title={t("Compétitions suivies")}
            type="competition"
            empty={t("Aucune compétition suivie.")}
          />
          <FavoriteGroup
            title={t("Joueurs suivis")}
            type="player"
            empty={t("Aucun joueur suivi.")}
          />
          <SavedNews />
        </div>
      </div>
    </Container>
  );
};

export default MyFootball;
