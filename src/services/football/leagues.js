/**
 * API-Football league IDs for the featured competitions.
 * The full catalog is also browsable via `/leagues?search=` — see
 * src/services/football/endpoints.js (getAllLeagues).
 */
export const FEATURED_LEAGUES = [
  { id: 39, name: "Premier League", country: "England" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 135, name: "Serie A", country: "Italy" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 61, name: "Ligue 1", country: "France" },
  { id: 2, name: "UEFA Champions League", country: "Europe" },
  { id: 3, name: "UEFA Europa League", country: "Europe" },
  {
    id: 848,
    name: "UEFA Europa Conference League",
    country: "Europe",
  },
  { id: 1, name: "FIFA World Cup", country: "World" },
];

export const getCurrentSeason = () => {
  const now = new Date();
  // European leagues run Aug–May; the "season" year is the year it started.
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
};

export const isCup = name =>
  /cup|champions league|europa league|conference league|world cup/i.test(name);
