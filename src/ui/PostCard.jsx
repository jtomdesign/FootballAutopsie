import React from "react";
import { HiArrowRight } from "react-icons/hi";
import { Link } from "react-router-dom";

const PostCard = ({ post, id }) => {
  return (
    <div
      className={`${id === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
      style={{
        background: `linear-gradient( 180deg, rgba(1, 22, 30, 0.2) 30%, rgba(1, 22, 30, 1) 100% ), url(${post.featuredImage}) center center / cover no-repeat  `,
        height: "50vh",
        borderRadius: "10px",
        position: "relative",
      }}
    >
      <div className="absolute bottom-0 px-5 py-4 z-10">
        {post.isBreaking && (
          <span className="text-emerald-200 py-2 text-[0.7rem] uppercase font-black mb-5 tracking-widest">
            Breaking
          </span>
        )}
        <h3 className="text-[2rem] text-gray-50 leading-10 font-serif hover:underline hover:cursor-pointer">
          {post.title}
        </h3>
        <Link
          to={`/news/${post.slug}`}
          className="text-gray-50 flex items-center gap-1 text-[0.6rem] uppercase font-bold tracking-widest mt-3 "
        >
          <span>Lire plus</span>
          <span>
            <HiArrowRight />
          </span>
        </Link>
      </div>
    </div>
  );
};

export default PostCard;
