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

/**
 * Public follower count for an entity (team/player/competition/match).
 * Returns null when the count_entity_followers RPC isn't available yet.
 */
export const getEntityFollowerCount = async ({ entityType, entityId }) => {
  if (!entityType || entityId == null) return null;
  const { data, error } = await supabase.rpc("count_entity_followers", {
    p_type: entityType,
    p_id: String(entityId),
  });
  if (error) return null;
  return Number(data ?? 0);
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

// ---------- Comments (articles + matches) ----------

const COMMENT_TABLES = { post: "comments", match: "match_comments" };
const entityColumn = entityType =>
  entityType === "match" ? "match_id" : "post_id";

export const getEntityComments = async (entityType, entityId) => {
  // Each table only has its own entity column — selecting both breaks
  // the query (42703 column does not exist).
  const cols =
    entityType === "match"
      ? "id, match_id, user_id, parent_id, content, status, created_at, updated_at"
      : "id, post_id, user_id, parent_id, content, status, created_at, updated_at";
  const { data, error } = await supabase
    .from(COMMENT_TABLES[entityType] ?? "comments")
    .select(cols)
    .eq(entityColumn(entityType), entityId)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const getComments = postId => getEntityComments("post", postId);

export const addEntityComment = async ({
  entityType = "post",
  entityId,
  content,
  parentId = null,
}) => {
  const id = await uid();
  if (!id) throw new Error("Connexion requise");
  const row = {
    user_id: id,
    parent_id: parentId,
    content: content.trim(),
  };
  row[entityColumn(entityType)] = entityId;
  const { data, error } = await supabase
    .from(COMMENT_TABLES[entityType] ?? "comments")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const addComment = ({ postId, ...vars }) =>
  addEntityComment({ ...vars, entityType: "post", entityId: postId });

export const updateEntityComment = async (entityType, commentId, content) => {
  const { error } = await supabase
    .from(COMMENT_TABLES[entityType] ?? "comments")
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) throw error;
};

export const updateComment = (commentId, content) =>
  updateEntityComment("post", commentId, content);

export const deleteEntityComment = async (entityType, commentId) => {
  const { error } = await supabase
    .from(COMMENT_TABLES[entityType] ?? "comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
};

export const deleteComment = (commentId, entityType = "post") =>
  deleteEntityComment(entityType, commentId);

export const moderateComment = async (commentId, status, entityType = "post") => {
  const { error } = await supabase
    .from(COMMENT_TABLES[entityType] ?? "comments")
    .update({ status })
    .eq("id", commentId);
  if (error) throw error;
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

export const getAllCommentsForAdmin = async () => {
  const [postsRes, matchesRes] = await Promise.all([
    supabase
      .from("comments")
      .select("*, post:Posts(title)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("match_comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (postsRes.error) throw postsRes.error;
  // match_comments may not exist yet on databases where the migration
  // hasn't been applied — tolerate that specific failure.
  const matchRows = matchesRes.error ? [] : (matchesRes.data ?? []);
  const merged = [
    ...(postsRes.data ?? []).map(c => ({ ...c, _entity: "post" })),
    ...matchRows.map(c => ({ ...c, _entity: "match" })),
  ];
  return merged.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
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

export const adminBroadcastNotification = async ({
  title,
  message,
  targetUrl,
  type = "announcement",
}) => {
  const { data, error } = await supabase.rpc("admin_broadcast_notification", {
    p_title: title,
    p_message: message ?? null,
    p_target_url: targetUrl ?? null,
    p_type: type,
  });
  if (error) throw error;
  return data ?? 0;
};

// ---------- Admin: user directory ----------

export const adminListUsers = async () => {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data ?? [];
};

export const adminSetUserRole = async (userId, role) => {
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
};

// ---------- Admin: contact messages ----------

export const getContactMessages = async () => {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
};

export const deleteContactMessage = async id => {
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) throw error;
};
