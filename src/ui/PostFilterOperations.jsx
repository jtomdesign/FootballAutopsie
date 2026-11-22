import React from "react";
import Filter from "./Filter";

const PostFilterOperations = () => {
  return (
    <div>
      <Filter
        filterField="status"
        options={[
          { value: "all", label: "Tous" },
          { value: "draft", label: "Brouillons" },
          { value: "published", label: "Publiés" },
          { value: "scheduled", label: "Planifiés" },
          { value: "unpublished", label: "Dépubliés" },
        ]}
      />
    </div>
  );
};

export default PostFilterOperations;
