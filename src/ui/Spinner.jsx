import React from "react";

const Spinner = () => {
  return (
    <div className="fa-spinner-bg fixed inset-0 z-50 flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-500/20 border-t-emerald-600"></div>
    </div>
  );
};

export default Spinner;
