import React from "react";
import { Link } from "react-router-dom";
import MatchRow from "./MatchRow";
import TeamLogo from "./TeamLogo";
import { FEATURED_LEAGUES } from "../../services/football/leagues";

const FEATURED_ORDER = new Map(FEATURED_LEAGUES.map((l, i) => [l.id, i]));

/**
 * Groups fixtures by league and renders MatchRow lists.
 * Featured competitions are shown first, then the rest alphabetically.
 * fixtures: normalized fixture[]
 */
const MatchList = ({ fixtures = [], showLeague = false }) => {
  const groups = React.useMemo(() => {
    const map = new Map();
    fixtures.forEach(f => {
      const key = f.league?.id ?? f.league?.name ?? "other";
      if (!map.has(key)) {
        map.set(key, { league: f.league, matches: [] });
      }
      map.get(key).matches.push(f);
    });
    // Live matches first, then by kickoff time
    map.forEach(g =>
      g.matches.sort(
        (a, b) =>
          Number(b.status?.isLive ?? false) -
            Number(a.status?.isLive ?? false) ||
          new Date(a.date) - new Date(b.date),
      ),
    );
    return [...map.values()].sort((a, b) => {
      const ai = FEATURED_ORDER.get(a.league?.id) ?? 999;
      const bi = FEATURED_ORDER.get(b.league?.id) ?? 999;
      if (ai !== bi) return ai - bi;
      return (a.league?.name ?? "").localeCompare(b.league?.name ?? "");
    });
  }, [fixtures]);

  if (!fixtures.length) return null;

  return (
    <div className="flex flex-col gap-4 fa-stagger">
      {groups.map(group => (
        <div
          key={group.league?.id ?? group.league?.name}
          className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden"
        >
          {showLeague && (
            <Link
              to={`/ligues/${group.league?.id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-900/40 border-b border-emerald-900/60 hover:bg-[#ecfdf5] transition-colors"
            >
              <TeamLogo
                logo={group.league?.logo}
                name={group.league?.name}
                size="w-5 h-5"
              />
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-100">
                {group.league?.name}
                {group.league?.country ? ` — ${group.league.country}` : ""}
              </span>
              {group.league?.round && (
                <span className="ml-auto text-[0.65rem] text-gray-400">
                  {group.league.round}
                </span>
              )}
            </Link>
          )}
          <div>
            {group.matches.map(f => (
              <MatchRow key={f.id} fixture={f} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchList;
