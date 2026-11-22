import React from "react";

const Spinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafafa]/60 backdrop-blur-[2px]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-500/20 border-t-emerald-600"></div>
    </div>
  );
};

export default Spinner;
