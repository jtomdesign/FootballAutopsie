import React from "react";

const SectionHeader = ({ title, subtitle, action, level = 2 }) => {
  const Heading = `h${level}`;
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <Heading className="text-2xl font-bold text-gray-50 font-menu tracking-wide uppercase">
          {title}
        </Heading>
        {/* subtitle intentionally not rendered */}
      </div>
      {action}
    </div>
  );
};

export default SectionHeader;
