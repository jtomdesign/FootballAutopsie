import React from "react";

const TeamLogo = ({ logo, name, size = "w-8 h-8", className = "", cover = false }) => {
  const [failed, setFailed] = React.useState(false);

  if (!logo || failed) {
    return (
      <div
        className={`${size} shrink-0 rounded-full bg-emerald-800/40 flex items-center justify-center text-emerald-100 font-bold text-xs uppercase ${className}`}
        title={name}
      >
        {(name ?? "?").slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={name ?? ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${size} ${cover ? "object-cover" : "object-contain"} shrink-0 ${className}`}
    />
  );
};

export default TeamLogo;
