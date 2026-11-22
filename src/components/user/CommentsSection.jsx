import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  RiHeartLine,
  RiHeartFill,
  RiReplyLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFlagLine,
  RiChat1Line,
  RiEmotionLine,
} from "react-icons/ri";
import {
  useComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useToggleCommentLike,
  useReportComment,
} from "../../hooks/user";
import { getCommentAuthors, getCommentLikes } from "../../services/user";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "../../utils/helpers";

const MAX_DEPTH = 3;

const EMOJIS = ["⚽", "🔥", "😂", "😍", "👏", "💪", "😮", "😢", "🤯", "👍", "👎", "❤️", "🎉", "😡", "🤔", "🥶"];

const insertAtCursor = (el, emoji, text, setter, cursorRef) => {
  const pos = cursorRef.current ?? el?.selectionStart ?? text.length;
  const next = `${text.slice(0, pos)}${emoji} ${text.slice(pos)}`;
  setter(next);
  requestAnimationFrame(() => {
    const p = pos + emoji.length + 1;
    el?.focus();
    el?.setSelectionRange(p, p);
    cursorRef.current = p;
  });
};

const EmojiBar = ({ onPick, active }) => (
  <div
    className={`flex flex-wrap gap-1 mt-2 transition-all ${
      active ? "max-h-20 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
    }`}
  >
    {EMOJIS.map(e => (
      <button
        key={e}
        type="button"
        onClick={() => onPick(e)}
        className="w-8 h-8 rounded-lg text-base hover:bg-emerald-500/15 flex items-center justify-center cursor-pointer transition-colors"
      >
        {e}
      </button>
    ))}
  </div>
);

const Avatar = ({ name, url }) =>
  url ? (
    <img
      src={url}
      alt={name}
      className="w-9 h-9 rounded-full object-cover bg-emerald-900/40"
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-sm font-black">
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );

const CommentItem = ({
  comment,
  authors,
  likes,
  liked,
  depth,
  postId,
  currentUserId,
  onReply,
  replies,
}) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const editRef = React.useRef(null);
  const editCursor = React.useRef(null);
  const update = useUpdateComment(postId);
  const del = useDeleteComment(postId);
  const like = useToggleCommentLike(postId);
  const report = useReportComment();

  const author = authors[comment.user_id];
  const name = author?.full_name || author?.username || t("Utilisateur");
  const isOwn = comment.user_id === currentUserId;

  const submitEdit = () => {
    if (!editText.trim()) return;
    update.mutate(
      { id: comment.id, content: editText },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className={depth > 0 ? "ml-6 sm:ml-10 mt-3" : ""}>
      <div className="flex gap-3">
        <Avatar name={name} url={author?.avatar_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-100">{name}</span>
            <span className="text-[0.65rem] text-gray-400">
              {formatDateTime(comment.created_at)}
              {comment.updated_at !== comment.created_at ? ` ${t("(modifié)")}` : ""}
            </span>
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea
                ref={editRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onSelect={e => (editCursor.current = e.target.selectionStart)}
                onKeyUp={e => (editCursor.current = e.target.selectionStart)}
                onClick={e => (editCursor.current = e.target.selectionStart)}
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
              />
              <div className="flex items-center gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setShowEmoji(s => !s)}
                  className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                    showEmoji ? "bg-emerald-500/20 text-emerald-600" : "text-gray-400 hover:text-emerald-600"
                  }`}
                  aria-label={t("Emoji")}
                >
                  <RiEmotionLine className="text-base" />
                </button>
              </div>
              <EmojiBar
                active={showEmoji}
                onPick={e =>
                  insertAtCursor(editRef.current, e, editText, setEditText, editCursor)
                }
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={submitEdit}
                  disabled={update.isPending || !editText.trim()}
                  className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {t("Enregistrer")}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditText(comment.content);
                  }}
                  className="px-3 py-1.5 rounded-full fa-tab-inactive bg-emerald-500/10 text-emerald-700 text-xs font-semibold cursor-pointer"
                >
                  {t("Annuler")}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-200 mt-1 whitespace-pre-line break-words">
              {comment.content}
            </p>
          )}

          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={() => like.mutate(comment.id)}
              className={`flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
            >
              {liked ? <RiHeartFill /> : <RiHeartLine />}
              {likes[comment.id] ?? 0}
            </button>
            {depth < MAX_DEPTH && (
              <button
                onClick={() => onReply(comment)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-emerald-600 cursor-pointer"
              >
                <RiReplyLine /> {t("Répondre")}
              </button>
            )}
            {isOwn && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-300 cursor-pointer"
                >
                  <RiEditLine /> {t("Modifier")}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(t("Supprimer ce commentaire ?")))
                      del.mutate(comment.id);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <RiDeleteBinLine /> {t("Supprimer")}
                </button>
              </>
            )}
            {!isOwn && (
              <button
                onClick={() => setReporting(r => !r)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <RiFlagLine /> {t("Signaler")}
              </button>
            )}
          </div>

          {reporting && (
            <div className="mt-2 flex gap-2">
              <input
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder={t("Raison du signalement…")}
                className="flex-1 px-3 py-1.5 rounded-full bg-emerald-900/40 text-xs text-gray-100 focus:outline-none"
              />
              <button
                onClick={() =>
                  report.mutate(
                    { commentId: comment.id, reason: reportReason || t("Inapproprié") },
                    { onSuccess: () => setReporting(false) },
                  )
                }
                disabled={report.isPending}
                className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold cursor-pointer"
              >
                {t("Envoyer")}
              </button>
            </div>
          )}
        </div>
      </div>

      {replies?.length > 0 && (
        <div className="mt-1">{replies}</div>
      )}
    </div>
  );
};

const CommentsSection = ({ postId }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useSelector(s => s.user);
  const navigate = useNavigate();
  const [sort, setSort] = useState("recent"); // recent | oldest | liked
  const [replyTo, setReplyTo] = useState(null);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const composerRef = React.useRef(null);
  const composerCursor = React.useRef(null);

  const { data: comments = [], isLoading } = useComments(postId);
  const add = useAddComment(postId);

  const authorIds = useMemo(
    () => [...new Set(comments.map(c => c.user_id))],
    [comments],
  );
  const { data: authors = {} } = useQuery({
    queryKey: ["comment-authors", authorIds.sort().join(",")],
    queryFn: () => getCommentAuthors(authorIds),
    enabled: authorIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const commentIds = useMemo(() => comments.map(c => c.id), [comments]);
  const { data: likeData } = useQuery({
    queryKey: ["comment-likes", commentIds.join(",")],
    queryFn: () => getCommentLikes(commentIds),
    enabled: commentIds.length > 0,
    staleTime: 30 * 1000,
  });
  const likes = useMemo(() => likeData?.counts ?? {}, [likeData]);
  const liked = useMemo(() => likeData?.mine ?? {}, [likeData]);

  // Thread comments
  const threads = useMemo(() => {
    const byParent = {};
    const roots = [];
    comments.forEach(c => {
      if (c.parent_id) (byParent[c.parent_id] ??= []).push(c);
      else roots.push(c);
    });
    const sortFn = (a, b) =>
      sort === "oldest"
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    roots.sort(sort === "liked" ? (a, b) => (likes[b.id] ?? 0) - (likes[a.id] ?? 0) : sortFn);
    const renderReplies = (parentId, depth) =>
      (byParent[parentId] ?? [])
        .slice()
        .sort(sortFn)
        .map(c => (
          <CommentItem
            key={c.id}
            comment={c}
            authors={authors}
            likes={likes}
            liked={liked}
            depth={depth}
            postId={postId}
            currentUserId={user?.id}
            onReply={setReplyTo}
            replies={renderReplies(c.id, depth + 1)}
          />
        ));
    return roots.map(c => (
      <CommentItem
        key={c.id}
        comment={c}
        authors={authors}
        likes={likes}
        liked={liked}
        depth={0}
        postId={postId}
        currentUserId={user?.id}
        onReply={setReplyTo}
        replies={renderReplies(c.id, 1)}
      />
    ));
  }, [comments, authors, likes, liked, sort, postId, user?.id]);

  const submit = () => {
    if (!text.trim()) return;
    if (!isAuthenticated) {
      toast(t("Connectez-vous pour commenter"), { icon: "🔒" });
      navigate("/compte");
      return;
    }
    add.mutate(
      { content: text, parentId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setText("");
          setReplyTo(null);
        },
      },
    );
  };

  return (
    <section className="mt-12 border-t border-emerald-900/60 pt-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <RiChat1Line className="text-emerald-600" />
          {t("Commentaires")} {comments.length > 0 && `(${comments.length})`}
        </h3>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-1.5 rounded-full bg-emerald-900/40 text-xs text-gray-100 focus:outline-none cursor-pointer"
        >
          <option value="recent">{t("Plus récents")}</option>
          <option value="oldest">{t("Plus anciens")}</option>
          <option value="liked">{t("Plus aimés")}</option>
        </select>
      </div>

      {/* Composer */}
      <div className="mb-6">
        {replyTo && (
          <p className="text-xs text-gray-500 mb-2">
            {t("Réponse à")}{" "}<strong>{authors[replyTo.user_id]?.full_name || authors[replyTo.user_id]?.username || "…"}</strong>
            <button
              onClick={() => setReplyTo(null)}
              className="ml-2 text-red-500 cursor-pointer"
            >
              {t("annuler")}
            </button>
          </p>
        )}
        <textarea
          ref={composerRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onSelect={e => (composerCursor.current = e.target.selectionStart)}
          onKeyUp={e => (composerCursor.current = e.target.selectionStart)}
          onClick={e => (composerCursor.current = e.target.selectionStart)}
          rows={3}
          maxLength={2000}
          placeholder={
            isAuthenticated
              ? t("Partagez votre avis…")
              : t("Connectez-vous pour commenter…")
          }
          className="w-full px-4 py-3 rounded-2xl bg-emerald-900/40 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowEmoji(s => !s)}
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                showEmoji ? "bg-emerald-500/20 text-emerald-600" : "text-gray-400 hover:text-emerald-600"
              }`}
              aria-label={t("Emoji")}
            >
              <RiEmotionLine className="text-base" />
            </button>
            <span className="text-[0.65rem] text-gray-400">{text.length}/2000</span>
          </div>
          <button
            onClick={submit}
            disabled={add.isPending || !text.trim()}
            className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-60"
          >
            {t("Publier")}
          </button>
        </div>
        <EmojiBar
          active={showEmoji}
          onPick={e =>
            insertAtCursor(composerRef.current, e, text, setText, composerCursor)
          }
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 py-4 text-center">{t("Chargement…")}</p>
      ) : threads.length ? (
        <div className="flex flex-col gap-5">{threads}</div>
      ) : (
        <p className="text-sm text-gray-400 py-4 text-center">
          {t("Soyez le premier à commenter cet article.")}
        </p>
      )}
    </section>
  );
};

export default CommentsSection;
