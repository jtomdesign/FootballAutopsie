import { supabase } from "./supabase";

const uid = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

// ---------- Profile ----------

export const getProfile = async () => {
  const id = await uid();
  if (!id) return null;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const updateProfile = async fields => {
  const id = await uid();
  if (!id) throw new Error("Non authentifié");
  const { error } = await supabase
    .from("user_profiles")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
};

// ---------- Favorites ----------

export const getFavorites = async type => {
  const id = await uid();
  if (!id) return [];
  let q = supabase
    .from("user_favorites")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  if (type) q = q.eq("entity_type", type);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
};

export const toggleFavorite = async ({ entityType, entityId, entityName, entityLogo }) => {
  const id = await uid();
  if (!id) throw new Error("Connexion requise");
  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", id)
    .eq("entity_type", entityType)
    .eq("entity_id", String(entityId))
    .maybeSingle();
  if (existing) {
    await supabase.from("user_favorites").delete().eq("id", existing.id);
    return false;
  }
  const { error } = await supabase.from("user_favorites").insert({
    user_id: id,
    entity_type: entityType,
    entity_id: String(entityId),
    entity_name: entityName ?? null,
    entity_logo: entityLogo ?? null,
  });
  if (error) throw error;
  return true;
};

export const isFavorite = async ({ entityType, entityId }) => {
  const id = await uid();
  if (!id) return false;
  const { data } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", id)
    .eq("entity_type", entityType)
    .eq("entity_id", String(entityId))
    .maybeSingle();
  return Boolean(data);
};

export const removeFavorite = async favId => {
  const { error } = await supabase.from("user_favorites").delete().eq("id", favId);
  if (error) throw error;
};

// ---------- Saved articles ----------

export const getSavedArticles = async () => {
  const id = await uid();
  if (!id) return [];
  const { data, error } = await supabase
    .from("saved_articles")
    .select("id, post_id, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const toggleSavedArticle = async postId => {
  const id = await uid();
  if (!id) throw new Error("Connexion requise");
  const { data: existing } = await supabase
    .from("saved_articles")
    .select("id")
    .eq("user_id", id)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    await supabase.from("saved_articles").delete().eq("id", existing.id);
    return false;
  }
  const { error } = await supabase
    .from("saved_articles")
    .insert({ user_id: id, post_id: postId });
  if (error) throw error;
  return true;
};

export const isArticleSaved = async postId => {
  const id = await uid();
  if (!id) return false;
  const { data } = await supabase
    .from("saved_articles")
    .select("id")
    .eq("user_id", id)
    .eq("post_id", postId)
    .maybeSingle();
  return Boolean(data);
};

export const unsaveArticle = async saveId => {
  const { error } = await supabase.from("saved_articles").delete().eq("id", saveId);
  if (error) throw error;
};

// ---------- Comments ----------

export const getComments = async postId => {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, parent_id, content, status, created_at, updated_at")
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const getCommentAuthors = async userIds => {
  if (!userIds.length) return {};
  // security-definer RPC: user_profiles RLS hides other users' rows,
  // this returns only public display fields (username/full_name/avatar).
  const { data, error } = await supabase.rpc("get_comment_authors", {
    ids: userIds,
  });
  if (error) throw error;
  const map = {};
  (data ?? []).forEach(p => (map[p.id] = p));
  return map;
};

export const addComment = async ({ postId, content, parentId = null }) => {
  const id = await uid();
  if (!id) throw new Error("Connexion requise");
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: id,
      parent_id: parentId,
      content: content.trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateComment = async (commentId, content) => {
  const { error } = await supabase
    .from("comments")
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) throw error;
};

export const deleteComment = async commentId => {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
};

export const moderateComment = async (commentId, status) => {
  const { error } = await supabase
    .from("comments")
    .update({ status })
    .eq("id", commentId);
  if (error) throw error;
};

export const getAllCommentsForAdmin = async () => {
  const { data, error } = await supabase
    .from("comments")
    .select("*, post:Posts(title)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
};

// ---------- Comment likes ----------

export const getCommentLikes = async commentIds => {
  if (!commentIds.length) return { counts: {}, mine: {} };
  const id = await uid();
  const { data, error } = await supabase
    .from("comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds);
  if (error) throw error;
  const counts = {};
  const mine = {};
  (data ?? []).forEach(l => {
    counts[l.comment_id] = (counts[l.comment_id] ?? 0) + 1;
    if (l.user_id === id) mine[l.comment_id] = true;
  });
  return { counts, mine };
};

export const toggleCommentLike = async commentId => {
  const id = await uid();
  if (!id) throw new Error("Connexion requise");
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", id)
    .maybeSingle();
  if (existing) {
    await supabase.from("comment_likes").delete().eq("id", existing.id);
    return false;
  }
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: id });
  if (error) throw error;
  return true;
};

// ---------- Comment reports ----------

export const reportComment = async ({ commentId, reason }) => {
  const id = await uid();
  if (!id) throw new Error("Connexion requise");
  const { error } = await supabase.from("comment_reports").insert({
    comment_id: commentId,
    reporter_id: id,
    reason,
  });
  if (error) throw error;
};

// ---------- Notifications ----------

export const getNotifications = async () => {
  const id = await uid();
  if (!id) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
};

export const unreadCount = async () => {
  const id = await uid();
  if (!id) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id)
    .eq("is_read", false);
  return count ?? 0;
};

export const markNotificationRead = async notifId => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notifId);
  if (error) throw error;
};

export const markAllNotificationsRead = async () => {
  const id = await uid();
  if (!id) return;
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", id)
    .eq("is_read", false);
  if (error) throw error;
};

export const deleteNotification = async notifId => {
  const { error } = await supabase.from("notifications").delete().eq("id", notifId);
  if (error) throw error;
};

export const notify = async ({ userId, type, title, message, targetUrl }) => {
  if (!userId) return;
  // Respect user preferences
  const { data: pref } = await supabase
    .from("notification_preferences")
    .select("enabled")
    .eq("user_id", userId)
    .eq("notification_type", type)
    .maybeSingle();
  if (pref && pref.enabled === false) return;
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    target_url: targetUrl ?? null,
  });
};
