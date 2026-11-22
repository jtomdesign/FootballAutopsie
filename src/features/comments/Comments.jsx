import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminComments, useModerateComment } from "../../hooks/user";
import { deleteComment, getCommentAuthors } from "../../services/user";
import { toast } from "react-hot-toast";
import { CardGridSkeleton } from "../../components/football/Skeleton";
import EmptyState from "../../components/football/EmptyState";
import { formatDateTime } from "../../utils/helpers";
import { RiDeleteBinLine, RiEyeOffLine, RiCheckLine } from "react-icons/ri";

const statusBadge = {
  published: "bg-emerald-500/15 text-emerald-600",
  hidden: "bg-amber-500/15 text-amber-600",
  deleted: "bg-red-500/15 text-red-500",
};

const FILTERS = [
  { value: "all", label: "Tous" },
  { value: "published", label: "Publiés" },
  { value: "hidden", label: "Masqués" },
];

const Comments = () => {
  const { user } = useSelector(s => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "editor";
  const [filter, setFilter] = useState("all");
  const { data: comments = [], isLoading } = useAdminComments(isAdmin);
  const moderate = useModerateComment();
  const qc = useQueryClient();

  const authorIds = [...new Set((comments ?? []).map(c => c.user_id).filter(Boolean))];
  const { data: authors = {} } = useQuery({
    queryKey: ["comment-authors", authorIds],
    queryFn: () => getCommentAuthors(authorIds),
    enabled: isAdmin && authorIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const authorName = id => {
    const a = authors[id];
    return a?.full_name || a?.username || `${id?.slice(0, 8)}…`;
  };

  const filtered =
    filter === "all" ? comments : comments.filter(c => c.status === filter);

  const remove = async id => {
    try {
      await deleteComment(id);
      qc.invalidateQueries({ queryKey: ["admin", "comments"] });
      toast.success("Commentaire supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!isAdmin)
    return (
      <EmptyState
        title="Accès refusé"
        message="Seuls les administrateurs peuvent modérer les commentaires."
      />
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-100">Commentaires</h1>
          <p className="text-sm text-gray-400 mt-1">
            Modération des commentaires des lecteurs.
          </p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                filter === f.value
                  ? "bg-emerald-600 text-white"
                  : "fa-tab-inactive bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : filtered.length ? (
        <div className="flex flex-col gap-3">
          {filtered.map(c => (
            <div
              key={c.id}
              className="bg-emerald-950/60 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-100">
                    {authorName(c.user_id)}
                  </span>
                  <span
                    className={`text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge[c.status] ?? "bg-gray-500/15 text-gray-500"}`}
                  >
                    {c.status}
                  </span>
                  <span className="text-[0.65rem] text-gray-400">
                    {formatDateTime(c.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1 line-clamp-2">{c.content}</p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  Sur : {c.post?.title ?? c.post_id}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.status !== "published" && (
                  <button
                    onClick={() => moderate.mutate({ id: c.id, status: "published" })}
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 cursor-pointer"
                    title="Publier"
                  >
                    <RiCheckLine />
                  </button>
                )}
                {c.status !== "hidden" && c.status !== "deleted" && (
                  <button
                    onClick={() => moderate.mutate({ id: c.id, status: "hidden" })}
                    className="p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 cursor-pointer"
                    title="Masquer"
                  >
                    <RiEyeOffLine />
                  </button>
                )}
                <button
                  onClick={() => remove(c.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                  title="Supprimer"
                >
                  <RiDeleteBinLine />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun commentaire" message="Aucun commentaire dans cette catégorie." />
      )}
    </div>
  );
};

export default Comments;
