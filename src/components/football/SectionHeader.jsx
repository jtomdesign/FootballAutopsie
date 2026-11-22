import React from "react";

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-50 font-menu tracking-wide uppercase">
        {title}
      </h2>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default SectionHeader;
