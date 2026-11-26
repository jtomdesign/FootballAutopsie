import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useFantasyStories,
  useCreateStory,
  useDeleteStory,
  useMarkStoryViewed,
  useReactToStory,
  useAchievements,
  useCheckAchievements,
  useChallenges,
} from "../../hooks/fantasy";
import { LuPlus, LuX, LuTrophy, LuTrash2 } from "react-icons/lu";

const EMOJIS = ["🔥", "⚽", "😂", "👏", "😍", "💪"];

const StoryRing = ({ story, onOpen, isMine }) => (
  <button onClick={onOpen} className="flex flex-col items-center gap-1.5 shrink-0">
    <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-emerald-400 to-amber-400">
      <div className="w-full h-full rounded-full bg-white p-[3px] overflow-hidden">
        {story.image_url ? (
          <img src={story.image_url} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          <div className="w-full h-full rounded-full bg-emerald-500/15 flex items-center justify-center text-xl font-bold text-emerald-400">
            {(story.author?.username ?? story.author?.full_name ?? "F")
              .slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </div>
    <span className="text-[11px] font-bold text-gray-400 max-w-[64px] truncate">
      {isMine ? "Vous" : (story.author?.username ?? story.author?.full_name ?? "?")}
    </span>
  </button>
);

export const StoriesRail = ({ seasonId, myTeam }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useSelector(s => s.user);
  const { data: stories } = useFantasyStories();
  const createStory = useCreateStory();
  const deleteStory = useDeleteStory();
  const [compose, setCompose] = useState(false);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [viewerIdx, setViewerIdx] = useState(null);

  const list = stories ?? [];

  const submit = async () => {
    if (!text.trim() && !imageUrl.trim()) return toast.error(t("Story vide"));
    try {
      await createStory.mutateAsync({
        text: text.trim() || " ",
        imageUrl: imageUrl.trim() || null,
        teamId: myTeam?.id ?? null,
        seasonId: seasonId ?? null,
      });
      toast.success(t("Story publiée"));
      setCompose(false);
      setText("");
      setImageUrl("");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="rounded-2xl bg-emerald-950/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-100 text-sm tracking-wide">
          {t("Stories Fantasy")}
        </h3>
        {isAuthenticated && (
          <button
            onClick={() => setCompose(true)}
            className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
          >
            <LuPlus className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {list.map((s, i) => (
          <StoryRing
            key={s.id}
            story={s}
            onOpen={() => setViewerIdx(i)}
            isMine={s.user_id === user?.id}
          />
        ))}
        {!list.length && (
          <p className="text-sm text-gray-400 py-4">
            {t("Aucune story — partagez votre équipe ou votre gameweek !")}
          </p>
        )}
      </div>

      {compose && (
        <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t("Partagez votre actualité fantasy…")}
            className="w-full rounded-lg fa-input px-3 py-2 text-sm h-20"
            maxLength={300}
          />
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder={t("URL image (optionnel)")}
            className="w-full rounded-lg fa-input px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={submit}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">
              {t("Publier")}
            </button>
            <button onClick={() => setCompose(false)}
              className="px-4 py-2 rounded-full text-sm font-bold text-gray-500">
              {t("Annuler")}
            </button>
          </div>
        </div>
      )}

      {viewerIdx != null && list[viewerIdx] && (
        <StoryViewer
          stories={list}
          index={viewerIdx}
          onClose={() => setViewerIdx(null)}
          onNav={setViewerIdx}
          onDelete={async id => {
            await deleteStory.mutateAsync(id);
            setViewerIdx(null);
          }}
        />
      )}
    </div>
  );
};

const StoryViewer = ({ stories, index, onClose, onNav, onDelete }) => {
  const { t } = useTranslation();
  const { user } = useSelector(s => s.user);
  const story = stories[index];
  const markViewed = useMarkStoryViewed();
  const react = useReactToStory();

  React.useEffect(() => {
    markViewed.mutate(story.id);
    const timer = setTimeout(() => {
      if (index < stories.length - 1) onNav(index + 1);
      else onClose();
    }, 8000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  React.useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < stories.length - 1) onNav(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onNav(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, stories.length, onNav, onClose]);

  if (!story) return null;
  const isMine = story.user_id === user?.id;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-emerald-500/10 text-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className={`h-full bg-white ${i === index ? "animate-[storybar_8s_linear_forwards]" : i < index ? "w-full" : "w-0"}`}
              />
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="absolute top-5 right-3 z-10 text-white/70 hover:text-white">
          <LuX className="w-5 h-5" />
        </button>

        <div className="p-6 pt-12 min-h-[380px] flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/100 flex items-center justify-center font-bold">
              {(story.author?.username ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm">
                {story.author?.username ?? story.author?.full_name ?? "?"}
              </p>
              <p className="text-[11px] text-gray-500">
                {new Date(story.created_at).toLocaleString("fr-FR", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {story.image_url && (
            <img src={story.image_url} alt="" className="rounded-xl mb-3 max-h-56 object-cover w-full" />
          )}
          <p className="text-lg font-semibold flex-1 whitespace-pre-wrap">{story.text}</p>

          <div className="flex items-center gap-2 mt-4">
            {EMOJIS.map(e => (
              <button key={e}
                onClick={() => react.mutate({ storyId: story.id, emoji: e })}
                className="text-xl hover:scale-125 transition-transform">
                {e}
              </button>
            ))}
            <span className="flex-1" />
            {isMine && (
              <button onClick={() => onDelete(story.id)}
                className="text-white/50 hover:text-red-400">
                <LuTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* tap zones */}
        <button className="absolute inset-y-0 left-0 w-1/3" onClick={e => { e.stopPropagation(); if (index > 0) onNav(index - 1); }} />
        <button className="absolute inset-y-0 right-0 w-1/3" onClick={e => { e.stopPropagation(); if (index < stories.length - 1) onNav(index + 1); else onClose(); }} />
      </div>
    </div>
  );
};

export const AchievementsShelf = ({ teamId }) => {
  const { t } = useTranslation();
  const { data } = useAchievements();
  const check = useCheckAchievements();
  const [checked, setChecked] = useState(false);

  React.useEffect(() => {
    if (teamId && !checked) {
      check.mutate(teamId, { onSettled: () => setChecked(true) });
    }
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const unlockedIds = useMemo(
    () => new Set((data?.unlocked ?? []).map(u => u.achievement_id)),
    [data],
  );

  return (
    <div className="rounded-2xl bg-emerald-950/60 p-4">
      <h3 className="font-bold text-gray-100 text-sm tracking-wide mb-3 flex items-center gap-2">
        <LuTrophy className="text-amber-500" /> {t("Succès")}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {(data?.all ?? []).map(a => {
          const got = unlockedIds.has(a.id);
          return (
            <div key={a.id}
              title={a.description_fr ?? a.name_fr}
              className={`shrink-0 w-24 rounded-xl p-3 text-center ${got ? "bg-amber-500/10" : "opacity-50"}`}>
              <div className="text-2xl mb-1">{got ? "🏆" : "🔒"}</div>
              <p className="text-[11px] font-bold text-gray-300 leading-tight">{a.name_fr}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChallengesShelf = ({ seasonId }) => {
  const { t } = useTranslation();
  const { data: challenges } = useChallenges(seasonId);
  if (!challenges?.length) return null;
  return (
    <div className="rounded-2xl bg-emerald-500/10 text-gray-100 p-4">
      <h3 className="font-bold text-sm tracking-wide text-emerald-300 mb-3">
        {t("Défis de la saison")}
      </h3>
      <div className="space-y-2">
        {challenges.map(c => (
          <div key={c.id} className="rounded-xl bg-white/5 p-3">
            <p className="font-bold text-sm">{c.title}</p>
            {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
            {c.reward && <p className="text-xs text-amber-300 mt-1 font-bold">🏆 {c.reward}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
