import React from "react";
import { formatDate } from "../../utils/helpers";
import {
  RiDeleteBinFill,
  RiPencilFill,
} from "react-icons/ri";
import { useDeletePost } from "../../hooks/useDeletePost";
import Modal from "../../ui/Modal";
import ConfirmDelete from "../../ui/ConfirmDelete";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  published: "bg-emerald-500/15 text-emerald-600",
  draft: "bg-gray-500/15 text-gray-500",
  scheduled: "bg-blue-500/15 text-blue-600",
  unpublished: "bg-red-500/15 text-red-500",
};

const PostRow = ({ post, gridClass }) => {
  const { deletePost, isDeleting } = useDeletePost();
  return (
    <div className={`${gridClass} py-3 border-b border-emerald-900/40 last:border-0 text-sm`}>
      <div className="h-14">
        <img
          className="h-full w-full rounded-lg object-cover bg-emerald-900/60"
          src={post.featuredImage}
          alt=""
          onError={e => (e.target.style.display = "none")}
        />
      </div>
      <p className="truncate font-semibold text-gray-100 pr-2">{post.title}</p>
      <p className="text-center text-gray-400 text-xs">{formatDate(post.created_at)}</p>

      <div className="text-center">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase ${STATUS_STYLES[post.status] ?? "bg-gray-500/15 text-gray-500"}`}
        >
          {post.status}
        </span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Link
          to={`/dashboard/posts/${post.id}/modifier`}
          className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          title="Modifier"
        >
          <RiPencilFill className="text-base" />
        </Link>
        <Modal>
          <Modal.Open opens="delete">
            <button className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer" title="Supprimer">
              <RiDeleteBinFill className="text-base" />
            </button>
          </Modal.Open>
          <Modal.Window name="delete">
            <ConfirmDelete
              onConfirm={() => deletePost(post.id)}
              element={`l'article « ${post.title} »`}
              isDeleting={isDeleting}
            />
          </Modal.Window>
        </Modal>
      </div>
    </div>
  );
};

export default PostRow;
