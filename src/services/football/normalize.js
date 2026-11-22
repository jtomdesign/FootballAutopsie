/**
 * Normalize API-Football payloads into stable shapes used across the app.
 * All functions are defensive — missing fields become null/empty rather than
 * throwing, so the UI can render partial data safely.
 */

export const normalizeTeam = t => ({
  id: t?.team?.id ?? t?.id ?? null,
  name: t?.team?.name ?? t?.name ?? "Unknown",
  code: t?.team?.code ?? t?.code ?? null,
  country: t?.team?.country ?? t?.country?.name ?? null,
  logo: t?.team?.logo ?? t?.logo ?? null,
  national: t?.team?.national ?? false,
  winner: t?.winner ?? null,
});

export const normalizeLeague = l => ({
  id: l?.league?.id ?? l?.id ?? null,
  name: l?.league?.name ?? l?.name ?? "Unknown",
  type: l?.league?.type ?? l?.type ?? "League",
  logo: l?.league?.logo ?? l?.logo ?? null,
  country: l?.country?.name ?? l?.country ?? null,
  flag: l?.country?.flag ?? null,
  seasons: l?.seasons ?? [],
  currentSeason: l?.seasons?.find(s => s.current)?.year ?? null,
});

const STATUS_MAP = {
  TBD: { label: "À venir", short: "TBD" },
  NS: { label: "À venir", short: "NS" },
  "1H": { label: "1ère mi-temps", short: "1H" },
  HT: { label: "Mi-temps", short: "HT" },
  "2H": { label: "2ème mi-temps", short: "2H" },
  ET: { label: "Prolongations", short: "ET" },
  BT: { label: "Pause", short: "BT" },
  P: { label: "Tirs au but", short: "P" },
  SUSP: { label: "Suspendu", short: "SUSP" },
  INT: { label: "Interrompu", short: "INT" },
  FT: { label: "Terminé", short: "FT" },
  AET: { label: "Terminé (ap.)", short: "AET" },
  PEN: { label: "Terminé (t.a.b.)", short: "PEN" },
  PST: { label: "Reporté", short: "PST" },
  CANC: { label: "Annulé", short: "CANC" },
  ABD: { label: "Abandonné", short: "ABD" },
  AWD: { label: "Forfait", short: "AWD" },
  WO: { label: "Forfait", short: "WO" },
};

export const getMatchStatus = fixture => {
  const short = fixture?.fixture?.status?.short ?? "NS";
  const elapsed = fixture?.fixture?.status?.elapsed ?? null;
  const base = STATUS_MAP[short] ?? { label: short, short };
  const isLive = ["1H", "2H", "HT", "ET", "BT", "P"].includes(short);
  const isFinished = ["FT", "AET", "PEN"].includes(short);
  const isUpcoming = ["NS", "TBD"].includes(short);
  const isPostponed = ["PST", "CANC", "SUSP", "INT", "ABD", "AWD", "WO"].includes(
    short,
  );

  return {
    raw: short,
    label: isLive && elapsed != null ? `${elapsed}'` : base.label,
    short: base.short,
    isLive,
    isFinished,
    isUpcoming,
    isPostponed,
  };
};

export const normalizeFixture = f => {
  const status = getMatchStatus(f);
  return {
    id: f?.fixture?.id ?? null,
    date: f?.fixture?.date ?? null,
    timestamp: f?.fixture?.timestamp ?? null,
    venue: f?.fixture?.venue?.name ?? null,
    city: f?.fixture?.venue?.city ?? null,
    referee: f?.fixture?.referee ?? null,
    status,
    league: {
      id: f?.league?.id ?? null,
      name: f?.league?.name ?? "Unknown",
      country: f?.league?.country ?? null,
      logo: f?.league?.logo ?? null,
      round: f?.league?.round ?? null,
      season: f?.league?.season ?? null,
    },
    homeTeam: normalizeTeam(f?.teams?.home),
    awayTeam: normalizeTeam(f?.teams?.away),
    goals: {
      home: f?.goals?.home ?? null,
      away: f?.goals?.away ?? null,
      halftime: {
        home: f?.score?.halftime?.home ?? null,
        away: f?.score?.halftime?.away ?? null,
      },
      fulltime: {
        home: f?.score?.fulltime?.home ?? null,
        away: f?.score?.fulltime?.away ?? null,
      },
    },
    events: (f?.events ?? []).map(e => ({
      time: e.time?.elapsed ?? null,
      extra: e.time?.extra ?? null,
      team: e.team?.name ?? null,
      teamId: e.team?.id ?? null,
      player: e.player?.name ?? null,
      assist: e.assist?.name ?? null,
      type: e.type ?? null, // Goal | Card | subst | Var
      detail: e.detail ?? null, // Normal Goal | Yellow Card | Red Card | subst ...
      comments: e.comments ?? null,
    })),
    lineups: (f?.lineups ?? []).map(l => ({
      team: normalizeTeam(l.team),
      formation: l.formation ?? null,
      coach: l.coach?.name ?? null,
      // Lineup player objects expose `pos` (G/D/M/A) and no photo
      startXI: (l.startXI ?? []).map(p =>
        normalizePlayer({ ...p.player, position: p.player?.pos ?? p.player?.position }),
      ),
      substitutes: (l.substitutes ?? []).map(p =>
        normalizePlayer({ ...p.player, position: p.player?.pos ?? p.player?.position }),
      ),
    })),
    statistics: (f?.statistics ?? []).map(s => ({
      team: s.team?.name ?? null,
      teamId: s.team?.id ?? null,
      stats: Object.fromEntries(
        (s.statistics ?? []).map(st => [st.type, st.value]),
      ),
    })),
  };
};

export const normalizePlayer = p => ({
  id: p?.id ?? null,
  name: p?.name ?? "Unknown",
  firstname: p?.firstname ?? null,
  lastname: p?.lastname ?? null,
  age: p?.age ?? null,
  birth: p?.birth ?? null,
  nationality: p?.nationality ?? null,
  height: p?.height ?? null,
  weight: p?.weight ?? null,
  photo: p?.photo ?? null,
  number: p?.number ?? null,
  position: p?.position ?? null,
  injured: p?.injured ?? null,
});

export const normalizeStandingRow = row => {
  const all = row?.all ?? {};
  return {
    rank: row?.rank ?? null,
    team: normalizeTeam(row?.team),
    points: row?.points ?? 0,
    goalsDiff: row?.goalsDiff ?? 0,
    group: row?.group ?? null,
    form: row?.form ?? null,
    status: row?.status ?? null,
    description: row?.description ?? null,
    played: all.played ?? 0,
    win: all.win ?? 0,
    draw: all.draw ?? 0,
    lose: all.lose ?? 0,
    goalsFor: all.goals?.for ?? 0,
    goalsAgainst: all.goals?.against ?? 0,
    cleanSheet: all.clean_sheet ?? 0,
  };
};

export const normalizeStatistic = s => ({
  team: s?.team ?? null,
  league: s?.league ?? null,
  fixtures: s?.fixtures ?? null,
  goals: s?.goals ?? null,
  cards: s?.cards ?? null,
  lineups: s?.lineups ?? null,
});

export const normalizeInjury = i => ({
  player: i?.player ?? null,
  team: i?.team ?? null,
  fixture: i?.fixture ?? null,
  reason: i?.player?.reason ?? null,
});
