import React from "react";
import PostRow from "./PostRow";
import { useAllPosts } from "../../hooks/usePostData";
import Spinner from "../../ui/Spinner";
import EmptyState from "../../components/football/EmptyState";
import { useSearchParams } from "react-router-dom";

const STATUS_FILTERS = {
  all: () => true,
  draft: p => p.status === "draft",
  unpublished: p => p.status === "unpublished",
  published: p => p.status === "published",
  scheduled: p => p.status === "scheduled",
};

const GRID = "grid grid-cols-[4.5rem_minmax(0,1fr)_7rem_6.5rem_5rem] items-center gap-3";

const PostTable = () => {
  const { data: posts = [], isLoading } = useAllPosts();
  const [searchParams] = useSearchParams();

  const filterValue = searchParams.get("status") || "all";
  const predicate = STATUS_FILTERS[filterValue] ?? STATUS_FILTERS.all;
  const filterPost = (posts ?? []).filter(predicate);

  if (isLoading) return <Spinner />;

  return (
    <div className="bg-emerald-950/60 rounded-2xl p-4 lg:p-5 overflow-x-auto">
      <div className={`${GRID} min-w-[40rem] pb-3 border-b border-emerald-900/60`}>
        <div className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 text-center">Image</div>
        <div className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Titre</div>
        <div className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 text-center">Date</div>
        <div className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 text-center">Statut</div>
        <div />
      </div>
      <div className="min-w-[40rem]">
        {filterPost.length ? (
          filterPost.map(post => <PostRow post={post} key={post.id} gridClass={GRID} />)
        ) : (
          <EmptyState
            title="Aucun article"
            message="Aucun article ne correspond à ce filtre."
          />
        )}
      </div>
    </div>
  );
};

export default PostTable;
