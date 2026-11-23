import React from "react";
import { useSearchParams } from "react-router-dom";
import Filter from "./Filter";

const SORT_OPTIONS = [
  { value: "newest", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "title_asc", label: "Titre A → Z" },
  { value: "title_desc", label: "Titre Z → A" },
];

const PostFilterOperations = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="flex items-center gap-3 flex-wrap">
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
      <select
        value={searchParams.get("sort") || "newest"}
        onChange={e => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value === "newest") next.delete("sort");
          else next.set("sort", e.target.value);
          setSearchParams(next);
        }}
        className="bg-emerald-900/40 border border-emerald-900/40 rounded-lg px-3 py-2 text-xs font-semibold text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
        aria-label="Trier les articles"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PostFilterOperations;
