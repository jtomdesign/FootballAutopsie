import React from "react";
import { useSearchParams } from "react-router-dom";

const Filter = ({ options, filterField }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFilter = searchParams.get(filterField) || options.at(0).value;

  const handleClick = function (value) {
    searchParams.set(filterField, value);
    setSearchParams(searchParams);
  };

  return (
    <div className="flex gap-2">
      {options.map(option => (
        <button
          className={`${
            option.value === currentFilter
              ? "bg-emerald-600 text-white"
              : "fa-tab-inactive bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
          } cursor-pointer px-3 py-2 text-xs rounded-full font-semibold transition-colors`}
          onClick={() => handleClick(option.value)}
          key={option.value}
          disabled={option.value === currentFilter}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default Filter;
