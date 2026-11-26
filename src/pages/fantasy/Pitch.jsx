import React from "react";
import { LuCrown } from "react-icons/lu";

const ROW_Y = { G: 87, D: 66, M: 44, F: 21 };

/**
 * Interactive pitch — starting XI positioned by formation line.
 * Click a player to set captain / vice-captain.
 */
const Pitch = ({ starters, capId, vcId, onPick }) => {
  const lines = ["G", "D", "M", "F"]
    .map(pos => ({ pos, players: starters.filter(p => p.position === pos) }))
    .filter(l => l.players.length);

  const dots = lines.flatMap(({ pos, players }) =>
    players.map((p, i) => {
      const n = players.length;
      const x = n === 1 ? 50 : 10 + (80 * i) / (n - 1);
      return { p, x, y: ROW_Y[pos] };
    }),
  );

  return (
    <div
      className="relative w-full min-w-[440px] rounded-2xl overflow-hidden shadow-inner"
      style={{
        aspectRatio: "68/105",
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 10%, transparent 10% 20%), linear-gradient(180deg, #047857 0%, #065f46 50%, #047857 100%)",
      }}
    >
      {/* pitch markings */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 68 105"
        preserveAspectRatio="none"
      >
        <g fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35">
          {/* boundary */}
          <rect x="2" y="2" width="64" height="101" rx="1" />
          {/* halfway line + center circle + spot */}
          <line x1="2" y1="52.5" x2="66" y2="52.5" />
          <circle cx="34" cy="52.5" r="9.15" />
          <circle cx="34" cy="52.5" r="0.5" fill="rgba(255,255,255,0.5)" stroke="none" />
          {/* top penalty area */}
          <rect x="13.84" y="2" width="40.32" height="16.5" />
          <rect x="24.84" y="2" width="18.32" height="5.5" />
          <circle cx="34" cy="11" r="0.5" fill="rgba(255,255,255,0.5)" stroke="none" />
          {/* bottom penalty area */}
          <rect x="13.84" y="86.5" width="40.32" height="16.5" />
          <rect x="24.84" y="97.5" width="18.32" height="5.5" />
          <circle cx="34" cy="94" r="0.5" fill="rgba(255,255,255,0.5)" stroke="none" />
          {/* penalty arcs */}
          <path d="M 22.5 19 A 9.15 9.15 0 0 1 45.5 19" />
          <path d="M 22.5 86 A 9.15 9.15 0 0 0 45.5 86" />
          {/* corner arcs */}
          <path d="M 2 6 A 4 4 0 0 1 6 2" />
          <path d="M 62 2 A 4 4 0 0 1 66 6" />
          <path d="M 66 99 A 4 4 0 0 1 62 103" />
          <path d="M 6 103 A 4 4 0 0 1 2 99" />
        </g>
      </svg>

      {dots.map(({ p, x, y }) => {
        const isCap = p.id === capId;
        const isVc = p.id === vcId;
        const pts = Number(p.lastGwPoints ?? p.totalPoints ?? 0);
        return (
          <button
            key={p.id}
            onClick={() => onPick?.(p)}
            title={`${p.name} — ${p.club_name ?? ""} (${pts} pts)`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className={`relative block rounded-full p-[2.5px] transition-transform duration-150 group-hover:scale-110 ${
                isCap
                  ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  : isVc
                    ? "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    : "bg-white/50"
              }`}
            >
              <span className="block w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-emerald-950 border-2 border-white/40 relative">
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-emerald-300">
                    {p.name?.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 text-[7px] font-bold bg-black/70 text-emerald-300 px-0.5 rounded-tl">
                  {p.position}
                </span>
              </span>
              {isCap && (
                <LuCrown className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-300 drop-shadow" />
              )}
              {isVc && !isCap && (
                <LuCrown className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-sky-300 drop-shadow" />
              )}
            </span>
            <span className="mt-1 flex flex-col items-center leading-none max-w-[90px]">
              <span className="px-1.5 py-px rounded bg-black/55 text-white text-[9px] sm:text-[10px] font-semibold whitespace-nowrap max-w-[76px] truncate group-hover:bg-black/75">
                {p.name}
              </span>
              <span className="text-[7px] sm:text-[8px] text-emerald-200/70 whitespace-nowrap max-w-[90px] truncate">
                {p.club_name}
              </span>
              <span className="mt-0.5 flex items-center gap-1">
                <span className="text-[8px] sm:text-[9px] font-bold text-white/80">
                  £{Number(p.price ?? p.price_paid ?? 0).toFixed(1)}m
                </span>
                {pts !== 0 && (
                  <span
                    className={`text-[8px] sm:text-[9px] font-bold px-1 rounded-full ${
                      pts > 0 ? "bg-emerald-500/80 text-white" : "bg-red-500/80 text-white"
                    }`}
                  >
                    {pts > 0 ? `+${pts}` : pts}
                  </span>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Pitch;
