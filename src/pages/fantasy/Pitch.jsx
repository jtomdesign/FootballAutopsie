import React from "react";
import { LuCrown } from "react-icons/lu";

/**
 * Interactive pitch — renders the starting XI positioned by formation.
 * Click a player to set captain / vice-captain (same handler as the lists).
 */
const Pitch = ({ starters, capId, vcId, onPick, formation }) => {
  const rows = [
    { players: starters.filter(p => p.position === "G"), y: 86 },
    { players: starters.filter(p => p.position === "D"), y: 64 },
    { players: starters.filter(p => p.position === "M"), y: 42 },
    { players: starters.filter(p => p.position === "F"), y: 20 },
  ];

  const place = (players, y) =>
    players.map((p, i) => {
      const n = players.length;
      const x = n === 1 ? 50 : 12 + (76 * i) / (n - 1);
      return { p, x, y };
    });

  const dots = rows.flatMap(r => place(r.players, r.y));

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/30"
      style={{
        aspectRatio: "68/105",
        background:
          "linear-gradient(180deg, #065f46 0%, #047857 55%, #065f46 100%)",
      }}>
      {/* pitch markings */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute border border-white/25"
          style={{ top: "2.5%", bottom: "2.5%", left: "4%", right: "4%", borderRadius: 4 }} />
        <div className="absolute border-t border-white/25" style={{ top: "50%", left: "4%", right: "4%" }} />
        <div className="absolute border border-white/25 rounded-full"
          style={{ top: "50%", left: "50%", width: "22%", aspectRatio: 1, transform: "translate(-50%,-50%)" }} />
        <div className="absolute border border-white/25"
          style={{ top: "8%", left: "28%", right: "28%", height: "14%" }} />
        <div className="absolute border border-white/25"
          style={{ bottom: "8%", left: "28%", right: "28%", height: "14%" }} />
      </div>

      {dots.map(({ p, x, y }) => {
        const isCap = p.id === capId;
        const isVc = p.id === vcId;
        return (
          <button
            key={p.id}
            onClick={() => onPick?.(p)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className={`relative block rounded-full p-[2px] transition-transform group-hover:scale-110 ${
              isCap ? "bg-amber-400" : isVc ? "bg-sky-400" : "bg-white/40"
            }`}>
              <span className="block w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-emerald-900 border border-white/30">
                {p.photo ? (
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/70">
                    {p.name?.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
              {isCap && (
                <LuCrown className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-amber-300" />
              )}
              {isVc && (
                <LuCrown className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 text-sky-300" />
              )}
            </span>
            <span className="mt-0.5 px-1.5 py-px rounded bg-black/50 text-white text-[9px] sm:text-[10px] font-semibold whitespace-nowrap max-w-[72px] truncate">
              {p.name?.split(" ").slice(-1)[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Pitch;
