import React from "react";

const POS_STYLE = {
  G: "bg-amber-500/100/15 text-amber-400",
  D: "bg-sky-500/100/15 text-sky-400",
  M: "bg-emerald-500/100/15 text-emerald-400",
  F: "bg-rose-500/15 text-rose-400",
};

export const PositionBadge = ({ position, className = "" }) => (
  <span
    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${POS_STYLE[position] ?? POS_STYLE.M} ${className}`}
  >
    {position}
  </span>
);

export const PlayerCard = ({ player, selected, onClick, showPoints = true }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left rounded-xl p-3 transition-all ${
      selected
        ? "bg-emerald-500/15"
        : "bg-white/5 hover:bg-white/10"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
        {player.photo ? (
          <img src={player.photo} alt={player.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-xs font-bold text-gray-400">
            {player.name?.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-100 truncate">{player.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {player.club_name ?? ""}
        </p>
      </div>
      <PositionBadge position={player.position} />
    </div>
    <div className="mt-2 flex items-center justify-between text-xs">
      <span className="font-bold text-emerald-400">£{Number(player.price).toFixed(1)}m</span>
      {showPoints && (
        <span className="text-gray-500">
          {player.totalPoints ?? 0} pts
          {player.lastGwPoints ? ` · ${player.lastGwPoints} dernière` : ""}
        </span>
      )}
    </div>
  </button>
);
