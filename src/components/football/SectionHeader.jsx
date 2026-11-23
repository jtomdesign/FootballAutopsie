import React from "react";

const SectionHeader = ({ title, subtitle, action, level = 2 }) => {
  const Heading = `h${level}`;
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div>
        <Heading className="text-xl font-bold text-gray-50 font-menu tracking-wide uppercase">
          {title}
        </Heading>
        {/* subtitle intentionally not rendered */}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeader;
