import React from "react";
import PostTable from "./PostTable";
import AddPost from "./AddPost";
import PostFilterOperations from "../../ui/PostFilterOperations";

const Posts = () => {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-100">Articles</h1>
          <p className="text-sm text-gray-400 mt-1">
            Créez, modifiez et publiez vos contenus.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PostFilterOperations />
          <AddPost />
        </div>
      </div>
      <PostTable />
    </div>
  );
};

export default Posts;
