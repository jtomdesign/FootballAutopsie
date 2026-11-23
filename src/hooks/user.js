import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useLiveFixtures } from "./football";
import { supabase } from "../services/supabase";
import i18n from "../i18n";
import {
  getProfile,
  updateProfile,
  getFavorites,
  getEntityFollowerCount,
  toggleFavorite,
  removeFavorite,
  getSavedArticles,
  toggleSavedArticle,
  unsaveArticle,
  getEntityComments,
  addComment,
  addEntityComment,
  updateComment,
  updateEntityComment,
  deleteComment,
  deleteEntityComment,
  moderateComment,
  getAllCommentsForAdmin,
  toggleCommentLike,
  reportComment,
  getNotifications,
  unreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  notify,
  adminSetUserRole,
  getContactMessages,
  deleteContactMessage,
} from "../services/user";

const USER_KEY = ["user-data"];
const isAuthed = state => Boolean(state.user?.isAuthenticated);

// ---------- Profile ----------

export const useProfile = () => {
  const authed = useSelector(isAuthed);
  return useQuery({
    queryKey: [...USER_KEY, "profile"],
    queryFn: getProfile,
    enabled: authed,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...USER_KEY, "profile"] });
      toast.success(i18n.t("Profil mis à jour"));
    },
    onError: e => toast.error(e.message),
  });
};

// ---------- Favorites ----------

export const useFavorites = type => {
  const authed = useSelector(isAuthed);
  return useQuery({
    queryKey: [...USER_KEY, "favorites", type ?? "all"],
    queryFn: () => getFavorites(type),
    enabled: authed,
    staleTime: 60 * 1000,
  });
};

// ---------- Entity followers ----------

export const useEntityFollowers = (entityType, entityId) =>
  useQuery({
    queryKey: [...USER_KEY, "followers", entityType, entityId],
    queryFn: () => getEntityFollowerCount({ entityType, entityId }),
    enabled: Boolean(entityType && entityId != null),
    staleTime: 60 * 1000,
  });

export const useToggleFavorite = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: added => {
      qc.invalidateQueries({ queryKey: [...USER_KEY, "favorites"] });
      qc.invalidateQueries({ queryKey: [...USER_KEY, "followers"] });
      toast.success(i18n.t(added ? "Ajouté à vos favoris" : "Retiré des favoris"));
    },
    onError: e => {
      if (/connexion/i.test(e.message)) {
        toast.error(i18n.t("Connectez-vous pour sauvegarder"));
        navigate("/compte");
      } else toast.error(e.message);
    },
  });
};

export const useRemoveFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...USER_KEY, "favorites"] });
      toast.success(i18n.t("Favori supprimé"));
    },
    onError: e => toast.error(e.message),
  });
};

// ---------- Saved articles ----------

export const useSavedArticles = () => {
  const authed = useSelector(isAuthed);
  return useQuery({
    queryKey: [...USER_KEY, "saved"],
    queryFn: getSavedArticles,
    enabled: authed,
    staleTime: 60 * 1000,
  });
};

export const useToggleSavedArticle = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: toggleSavedArticle,
    onSuccess: saved => {
      qc.invalidateQueries({ queryKey: [...USER_KEY, "saved"] });
      toast.success(i18n.t(saved ? "Article enregistré" : "Article retiré"));
    },
    onError: e => {
      if (/connexion/i.test(e.message)) {
        toast.error(i18n.t("Connectez-vous pour enregistrer"));
        navigate("/compte");
      } else toast.error(e.message);
    },
  });
};

export const useUnsaveArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unsaveArticle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...USER_KEY, "saved"] });
      toast.success(i18n.t("Article retiré"));
    },
    onError: e => toast.error(e.message),
  });
};

// ---------- Comments ----------

export const useEntityComments = (entityType, entityId) =>
  useQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: () => getEntityComments(entityType, entityId),
    enabled: Boolean(entityId),
    staleTime: 30 * 1000,
  });

export const useComments = postId => useEntityComments("post", postId);

export const useAddEntityComment = (entityType, entityId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vars =>
      addEntityComment({ entityType, entityId, ...vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success(i18n.t("Commentaire publié"));
    },
    onError: e => toast.error(e.message),
  });
};

export const useAddComment = postId => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vars => addComment({ postId, ...vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", "post", postId] });
      toast.success(i18n.t("Commentaire publié"));
    },
    onError: e => toast.error(e.message),
  });
};

export const useUpdateEntityComment = (entityType, entityId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => updateEntityComment(entityType, id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success(i18n.t("Commentaire modifié"));
    },
    onError: e => toast.error(e.message),
  });
};

export const useUpdateComment = postId => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => updateComment(id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", "post", postId] });
      toast.success(i18n.t("Commentaire modifié"));
    },
    onError: e => toast.error(e.message),
  });
};

export const useDeleteEntityComment = (entityType, entityId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => deleteEntityComment(entityType, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success(i18n.t("Commentaire supprimé"));
    },
    onError: e => toast.error(e.message),
  });
};

export const useDeleteComment = postId => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", "post", postId] });
      toast.success(i18n.t("Commentaire supprimé"));
    },
    onError: e => toast.error(e.message),
  });
};

export const useModerateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, entityType }) =>
      moderateComment(id, status, entityType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "comments"] });
      toast.success(i18n.t("Commentaire modéré"));
    },
    onError: e => toast.error(e.message),
  });
};

export const useAdminComments = enabled =>
  useQuery({
    queryKey: ["admin", "comments"],
    queryFn: getAllCommentsForAdmin,
    enabled,
    staleTime: 30 * 1000,
  });

export const useToggleCommentLike = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: toggleCommentLike,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["comment-likes"] });
    },
    onError: e => {
      if (/connexion/i.test(e.message)) navigate("/compte");
      else toast.error(e.message);
    },
  });
};

export const useReportComment = () => {
  return useMutation({
    mutationFn: reportComment,
    onSuccess: () => toast.success(i18n.t("Signalement envoyé")),
    onError: e => toast.error(e.message),
  });
};

// ---------- Notifications ----------

export const useNotifications = () => {
  const authed = useSelector(isAuthed);
  return useQuery({
    queryKey: [...USER_KEY, "notifications"],
    queryFn: getNotifications,
    enabled: authed,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useUnreadNotifications = () => {
  const authed = useSelector(isAuthed);
  return useQuery({
    queryKey: [...USER_KEY, "notifications", "unread"],
    queryFn: unreadCount,
    enabled: authed,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...USER_KEY, "notifications"] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...USER_KEY, "notifications"] });
      toast.success(i18n.t("Toutes les notifications marquées comme lues"));
    },
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...USER_KEY, "notifications"] }),
  });
};

/**
 * Generates in-app notifications for live matches involving the user's
 * followed teams or saved matches. Runs once per session when data is ready.
 */
export const useSyncNotifications = () => {
  const authed = useSelector(isAuthed);
  const { data: favorites = [] } = useFavorites();
  const { data: live = [] } = useLiveFixtures();
  const done = useRef(false);

  useEffect(() => {
    if (!authed || done.current || !favorites.length || !live.length) return;
    done.current = true;
    (async () => {
      try {
        const [notifs, { data: auth }] = await Promise.all([
          getNotifications(),
          supabase.auth.getUser(),
        ]);
        const userId = auth.user?.id;
        if (!userId) return;
        const seen = new Set(notifs.map(n => n.target_url));
        const favTeamIds = new Set(
          favorites
            .filter(f => f.entity_type === "team")
            .map(f => Number(f.entity_id)),
        );
        const favMatchIds = new Set(
          favorites
            .filter(f => f.entity_type === "match")
            .map(f => String(f.entity_id)),
        );
        for (const f of live) {
          const involved =
            favTeamIds.has(f.homeTeam?.id) ||
            favTeamIds.has(f.awayTeam?.id) ||
            favMatchIds.has(String(f.id));
          if (!involved) continue;
          const url = `/match/${f.id}`;
          if (seen.has(url)) continue;
          await notify({
            userId,
            type: "match_live",
            title: i18n.t("Match en direct"),
            message: `${f.homeTeam?.name ?? "?"} ${f.goals?.home ?? 0} - ${f.goals?.away ?? 0} ${f.awayTeam?.name ?? "?"} (${f.status?.label ?? ""})`,
            targetUrl: url,
          });
          seen.add(url);
        }
      } catch {
        /* notifications are best-effort */
      }
    })();
  }, [authed, favorites, live]);
};

// ---------- Admin: role management ----------

export const useSetUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => adminSetUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(i18n.t("Rôle mis à jour"));
    },
    onError: e => toast.error(e.message),
  });
};

// ---------- Admin: contact messages ----------

export const useContactMessages = enabled =>
  useQuery({
    queryKey: ["admin", "contact-messages"],
    queryFn: getContactMessages,
    enabled,
    staleTime: 30 * 1000,
  });

export const useDeleteContactMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteContactMessage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
      toast.success(i18n.t("Message supprimé"));
    },
    onError: e => toast.error(e.message),
  });
};
