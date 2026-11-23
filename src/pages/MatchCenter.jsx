import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { useFixture, usePlayerSearch } from "../hooks/football";
import Spinner from "../ui/Spinner";
import EmptyState from "../components/football/EmptyState";
import TeamLogo from "../components/football/TeamLogo";
import FollowButton from "../components/user/FollowButton";
import ImageDownloadButton from "../components/football/ImageDownloadButton";
import { formatMatchDay, formatMatchTime, countryFlag } from "../utils/helpers";
import {
  RiErrorWarningLine,
  RiArrowLeftLine,
  RiArrowUpDownLine,
  RiCloseLine,
  RiMapPinLine,
  RiUserLine,
  RiFootballLine,
  RiGiftLine,
} from "react-icons/ri";

const EventIcon = ({ detail }) => {
  const d = (detail ?? "").toLowerCase();
  if (d.includes("missed penalty") || d.includes("penalty missed"))
    return <RiCloseLine className="text-red-500 text-[0.85rem] leading-none" />;
  if (d.includes("yellow") && !d.includes("second"))
    return <span className="w-2.5 h-3.5 rounded-[2px] bg-yellow-400 inline-block" />;
  if (d.includes("red") || d.includes("second yellow"))
    return <span className="w-2.5 h-3.5 rounded-[2px] bg-red-500 inline-block" />;
  if (d.includes("subst"))
    return <RiArrowUpDownLine className="text-emerald-500 text-[0.9rem] leading-none" />;
  if (d.includes("goal"))
    return <span className="text-[0.8rem] leading-none">⚽</span>;
  return <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />;
};

const isGoal = e =>
  e.type === "Goal" && !/own goal/i.test(e.detail ?? "");

const isOwnGoal = e => e.type === "Goal" && /own goal/i.test(e.detail ?? "");

// Penalty-shootout kicks arrive as Goal events at elapsed >= 120 — they
// don't count toward the scoreboard.
const isShootout = e => (e.time ?? 0) >= 120 && /penalt/i.test(e.detail ?? "");

const isPenaltyMiss = e => {
  const d = (e.detail ?? "").toLowerCase();
  return (
    !isShootout(e) &&
    d.includes("penalt") &&
    (d.includes("miss") || d.includes("saved") || d.includes("fail"))
  );
};

// Goals that count on the scoreboard — excludes misses, shootouts, disallowed
const countsAsGoal = e =>
  isGoal(e) &&
  !isPenaltyMiss(e) &&
  !isShootout(e) &&
  !/shootout|disallowed|cancelled|var\b/i.test(e.detail ?? "");

const normName = s =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Compact scorer label — "Erling Haaland" → "E. Haaland"
const shortName = n => {
  const parts = (n ?? "").trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}. ${parts.slice(1).join(" ")}`
    : n;
};

const eventMinute = e => `${e.time ?? ""}${e.extra ? `+${e.extra}` : ""}'`;

const Timeline = ({ events = [], playerIds = {} }) => {
  const { t } = useTranslation();
  if (!events.length)
    return (
      <p className="text-gray-500 text-sm py-4 text-center">
        {t("Aucun événement disponible pour ce match.")}
      </p>
    );
  return (
    <ol>
      {events.map((e, i) => {
        const goal = isGoal(e);
        const pid = playerIds[normName(e.player)];
        return (
          <li key={i} className="pb-5 last:pb-1">
            <div className="flex items-baseline gap-3">
              <span className="w-5 shrink-0 flex items-center justify-center self-start pt-0.5">
                <EventIcon detail={e.detail} />
              </span>
              <span
                className={`w-9 shrink-0 text-right text-[0.7rem] font-semibold tabular-nums ${
                  goal ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {eventMinute(e)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  {pid ? (
                    <Link
                      to={`/joueurs/${pid}`}
                      className={`font-medium hover:underline ${
                        goal ? "fa-ink--goal" : "fa-ink"
                      }`}
                    >
                      {e.player}
                    </Link>
                  ) : (
                    <span
                      className={`font-medium ${
                        goal ? "fa-ink--goal" : "fa-ink"
                      }`}
                    >
                      {e.player}
                    </span>
                  )}
                  {e.assist && (
                    <span className="text-gray-400"> · {t("passe à")} {e.assist}</span>
                  )}
                </p>
                <p className="text-[0.7rem] text-gray-400 mt-0.5">
                  {e.team} — {t(e.detail ?? "")}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

const sentenceCase = s =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const StatBar = ({ label, home, away }) => {
  const { t } = useTranslation();
  const toNum = v => {
    if (v == null) return null;
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const h = toNum(home) ?? 0;
  const a = toNum(away) ?? 0;
  const total = h + a;
  const homePct = total ? (h / total) * 100 : 50;
  const hasValue = total > 0;
  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-baseline text-xs mb-1.5">
        <span className="font-bold tabular-nums text-gray-100">
          {home ?? "—"}
        </span>
        <span className="text-gray-500 tracking-wide text-[0.7rem] font-medium">
          {sentenceCase(t(label))}
        </span>
        <span className="font-bold tabular-nums text-gray-100">
          {away ?? "—"}
        </span>
      </div>
      <div className="fa-statbar-track flex h-2 rounded-full overflow-hidden bg-emerald-100">
        {hasValue && (
          <>
            <div
              className="fa-statbar-home bg-emerald-500 transition-all duration-700"
              style={{ width: `${homePct}%` }}
            />
            <div className="fa-statbar-away bg-emerald-300 flex-1 transition-all duration-700" />
          </>
        )}
      </div>
    </div>
  );
};

const POS_LABEL = {
  Goalkeeper: "GK",
  Defender: "D",
  Midfielder: "M",
  Attacker: "A",
  G: "GK",
  D: "D",
  M: "M",
  A: "A",
};

const parseFormation = formation => {
  const lines = (formation ?? "")
    .split("-")
    .map(n => parseInt(n, 10))
    .filter(n => Number.isFinite(n) && n > 0);
  return lines.length ? lines : null;
};

/**
 * Renders a vertical football pitch with players positioned by formation.
 * startXI is ordered GK → defenders → mids → attackers by the API.
 */
const PitchView = ({ lineup, scorers = {}, assisters = {}, players = {} }) => {
  const xi = lineup?.startXI ?? [];
  if (!xi.length) return null;

  const formation = parseFormation(lineup.formation);
  const gk = xi[0];
  const outfield = xi.slice(1);

  // Group outfield players into lines (formation counts, or even split)
  const lines = [];
  if (formation) {
    let idx = 0;
    for (const count of formation) {
      lines.push(outfield.slice(idx, idx + count));
      idx += count;
    }
    if (idx < outfield.length) lines[lines.length - 1].push(...outfield.slice(idx));
  } else {
    const per = Math.ceil(outfield.length / 2);
    lines.push(outfield.slice(0, per), outfield.slice(per));
  }

  // y for each line: defenders near bottom, attackers near top
  const m = lines.length;
  const lineY = i => (m === 1 ? 45 : 68 - (i * 46) / (m - 1));

  const nodes = [
    { p: gk, x: 50, y: 90 },
    ...lines.flatMap((line, i) =>
      line.map((p, j) => ({
        p,
        x: ((j + 1) * 100) / (line.length + 1),
        y: lineY(i),
      })),
    ),
  ];

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden my-4 bg-emerald-600">
      {/* mowed stripes */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 28px, rgba(255,255,255,0.9) 28px 56px)",
        }}
      />
      {/* soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.28)_100%)]" />
      {/* watermark logo */}
      <img
        src="/fa-logo-white.png"
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/5 max-w-[10rem] opacity-[0.14] pointer-events-none select-none"
        draggable={false}
      />
      {/* pitch markings */}
      <div className="absolute inset-0 border-[3px] border-white/60" />
      <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60" />
      {/* top penalty area */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-44 sm:w-60 h-20 sm:h-28 border-[3px] border-t-0 border-white/40 rounded-b-2xl" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-24 sm:w-32 h-8 sm:h-10 border-[3px] border-t-0 border-white/40 rounded-b-lg" />
      <div className="absolute left-1/2 top-[13%] sm:top-[11%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
      {/* bottom penalty area */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-44 sm:w-60 h-20 sm:h-28 border-[3px] border-b-0 border-white/40 rounded-t-2xl" />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-24 sm:w-32 h-8 sm:h-10 border-[3px] border-b-0 border-white/40 rounded-t-lg" />
      <div className="absolute left-1/2 bottom-[13%] sm:bottom-[11%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
      {/* corner arcs */}
      <div className="absolute top-0 left-0 w-5 h-5 border-b-2 border-r-2 border-white/40 rounded-br-full" />
      <div className="absolute top-0 right-0 w-5 h-5 border-b-2 border-l-2 border-white/40 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-t-2 border-r-2 border-white/40 rounded-tr-full" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-t-2 border-l-2 border-white/40 rounded-tl-full" />

      {nodes.map(({ p, x, y }) => {
        if (!p) return null;
        const info = players[normName(p.name)] ?? {};
        const photo = info.photo ?? p.photo;
        const pid = info.id ?? p.id;
        const flag = countryFlag(info.nationality);
        const scored = !!scorers[normName(p.name)];
        const assisted = !!assisters[normName(p.name)];
        const nameEl = (
          <>
            {flag && <span className="mr-0.5">{flag}</span>}
            {p.name}
            {scored && (
              <RiFootballLine className="inline ml-0.5 text-amber-300 align-[-1px]" />
            )}
            {assisted && (
              <RiGiftLine className="inline ml-0.5 text-sky-200 align-[-1px]" />
            )}
          </>
        );
        return (
          <div
            key={p.id ?? p.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className={`relative rounded-full bg-white/95 p-0.5 shadow-lg shadow-black/30 ring-1 ring-white/50 ${
                scored ? "ring-[3px] ring-amber-300" : ""
              }`}
            >
              <TeamLogo
                logo={photo}
                name={p.name}
                size="w-9 h-9 sm:w-11 sm:h-11"
                cover
                className="rounded-full"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-950 text-white text-[0.55rem] font-black flex items-center justify-center tabular-nums">
                {p.number ?? ""}
              </span>
            </div>
            <span
              className={`mt-1 max-w-[4.5rem] truncate text-center text-[0.6rem] sm:text-[0.65rem] leading-tight drop-shadow ${
                scored ? "text-amber-200 font-bold" : "text-white font-medium"
              }`}
            >
              {pid ? (
                <Link to={`/joueurs/${pid}`} className="hover:underline">
                  {nameEl}
                </Link>
              ) : (
                nameEl
              )}
            </span>
            <span className="text-[0.5rem] uppercase tracking-wider text-white/70">
              {POS_LABEL[p.position] ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MatchCenter = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: match, isLoading } = useFixture(id);
  const [tab, setTab] = React.useState("chronologie");
  const [teamTab, setTeamTab] = React.useState("home");
  const pitchRef = React.useRef(null);

  // Squad data gives real photos, player ids and nationalities for the pitch
  const season = match?.league?.season;
  const { data: homePlayers = [] } = usePlayerSearch({
    team: match?.homeTeam?.id,
    season,
  });
  const { data: awayPlayers = [] } = usePlayerSearch({
    team: match?.awayTeam?.id,
    season,
  });

  const playerInfo = React.useMemo(() => {
    const map = {};
    for (const p of [...homePlayers, ...awayPlayers]) {
      if (p?.name) map[normName(p.name)] = p;
    }
    return map;
  }, [homePlayers, awayPlayers]);

  if (isLoading) return <Spinner />;
  if (!match)
    return (
      <Container>
        <div className="py-24">
          <EmptyState
            title={t("Match introuvable")}
            message={t("Ce match n'existe pas ou n'est pas encore disponible.")}
            icon={<RiErrorWarningLine />}
          />
        </div>
      </Container>
    );

  const { homeTeam, awayTeam, goals, status, league, events, lineups, statistics } = match;
  const homeStats = statistics.find(s => s.teamId === homeTeam.id)?.stats ?? {};
  const awayStats = statistics.find(s => s.teamId === awayTeam.id)?.stats ?? {};
  const statKeys = Object.keys(homeStats).length
    ? Object.keys(homeStats)
    : Object.keys(awayStats);

  // Goals, scorer map (for lineup badges) and player name → id (for links)
  const goalEvents = events.filter(isGoal);
  const scorerEvents = events
    .filter(e => countsAsGoal(e) || isPenaltyMiss(e) || isOwnGoal(e))
    .sort(
      (a, b) =>
        (a.time ?? 0) * 100 + (a.extra ?? 0) -
        ((b.time ?? 0) * 100 + (b.extra ?? 0))
    );
  const scorers = {};
  const assisters = {};
  const playerIds = {};
  for (const e of goalEvents) {
    if (!countsAsGoal(e)) continue;
    if (e.player) scorers[normName(e.player)] = true;
    if (e.assist) assisters[normName(e.assist)] = true;
  }
  for (const l of lineups) {
    for (const p of [...(l.startXI ?? []), ...(l.substitutes ?? [])]) {
      if (p?.name && p?.id != null) playerIds[normName(p.name)] = p.id;
    }
  }

  // Scorers per team with minutes (for the header, under each team name)
  const homeScorers = [];
  const awayScorers = [];
  const teamScorerMap = {
    [homeTeam.id]: homeScorers,
    [awayTeam.id]: awayScorers,
    [normName(homeTeam.name)]: homeScorers,
    [normName(awayTeam.name)]: awayScorers,
  };
  for (const e of goalEvents) {
    if (!countsAsGoal(e) || !e.player) continue;
    const list = teamScorerMap[e.teamId] ?? teamScorerMap[normName(e.team)];
    if (list) list.push({ name: e.player, minute: eventMinute(e) });
  }
  // Own goals: the API credits `team` to the side that BENEFITED
  // (verified: Barcelona vs Villarreal — OG event team = Barcelona)
  for (const e of events.filter(isOwnGoal)) {
    if (!e.player) continue;
    const list = teamScorerMap[e.teamId] ?? teamScorerMap[normName(e.team)];
    if (list) list.push({ name: e.player, minute: eventMinute(e), own: true });
  }

  const tabs = [
    scorerEvents.length > 0 && { id: "buteurs", label: t("Buteurs") },
    { id: "chronologie", label: t("Chronologie") },
    statKeys.length > 0 && { id: "statistiques", label: t("Statistiques") },
    lineups.length > 0 && { id: "compositions", label: t("Compositions") },
  ].filter(Boolean);
  const activeTab = tabs.some(t => t.id === tab) ? tab : tabs[0]?.id;

  const homeLineup = lineups.find(l => l.team.id === homeTeam.id);
  const awayLineup = lineups.find(l => l.team.id === awayTeam.id);
  const activeLineup = teamTab === "away" ? awayLineup : homeLineup;

  return (
    <Container>
      <div className="py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/matchs"
            className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold hover:text-emerald-300"
          >
            <RiArrowLeftLine /> {t("Tous les matchs")}
          </Link>
          <FollowButton
            entityType="match"
            entityId={match.id}
            entityName={`${homeTeam.name} vs ${awayTeam.name}`}
            entityLogo={league.logo}
            small
          />
        </div>

        {/* Header */}
        <div className="bg-emerald-950/70 border border-emerald-900/60 rounded-3xl p-5 sm:p-10 text-center mb-8 fa-fade-up">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 uppercase tracking-widest mb-6">
            {league.logo && <TeamLogo logo={league.logo} name={league.name} size="w-4 h-4" />}
            <Link to={`/ligues/${league.id}`} className="hover:text-emerald-300">
              {league.name}
            </Link>
            {league.round && <span>· {league.round}</span>}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <Link to={`/equipes/${homeTeam.id}`} className="flex flex-col items-center gap-3 group">
                <TeamLogo logo={homeTeam.logo} name={homeTeam.name} size="w-14 h-14 sm:w-24 sm:h-24" />
                <span className="font-semibold text-gray-100 group-hover:text-emerald-300 transition-colors text-xs sm:text-sm">
                  {homeTeam.name}
                </span>
              </Link>
              <div className="flex flex-col items-center gap-0.5 min-h-[3.4rem]">
                {homeScorers.map((s, i) => {
                  const pid = playerIds[normName(s.name)];
                  const cls = "text-[0.65rem] text-emerald-400 hover:underline whitespace-nowrap";
                  return pid ? (
                    <Link key={`${s.name}-${s.minute}-${i}`} to={`/joueurs/${pid}`} className={cls}>
                      ⚽ {shortName(s.name)} <span className="text-gray-500">{s.minute}{s.own ? " (csc)" : ""}</span>
                    </Link>
                  ) : (
                    <span key={`${s.name}-${s.minute}-${i}`} className={cls}>⚽ {shortName(s.name)} <span className="text-gray-500">{s.minute}{s.own ? " (csc)" : ""}</span></span>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center px-1 sm:px-4">
              {status.isLive || status.isFinished ? (
                <>
                  <span
                    className={`text-2xl sm:text-4xl font-semibold tabular-nums ${
                      status.isLive ? "text-red-500" : "text-gray-50"
                    }`}
                  >
                    {goals.home ?? 0} - {goals.away ?? 0}
                  </span>
                  <span
                    className={`mt-3 text-[0.65rem] font-medium uppercase tracking-wider px-3 py-1 rounded-full ${
                      status.isLive
                        ? "bg-red-500/15 text-red-500"
                        : "bg-emerald-500/15 text-emerald-500"
                    }`}
                  >
                    {t(status.label)}
                  </span>
                  {goals.halftime.home != null && (
                    <span className="text-gray-500 text-xs mt-2.5 tabular-nums">
                      {t("Mi-temps :")} {goals.halftime.home} - {goals.halftime.away}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-semibold text-gray-100 tabular-nums">
                    {formatMatchTime(match.date)}
                  </span>
                  <span className="mt-2 text-xs font-medium uppercase tracking-widest text-gray-500">
                    {formatMatchDay(match.date)}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <Link to={`/equipes/${awayTeam.id}`} className="flex flex-col items-center gap-3 group">
                <TeamLogo logo={awayTeam.logo} name={awayTeam.name} size="w-14 h-14 sm:w-24 sm:h-24" />
                <span className="font-semibold text-gray-100 group-hover:text-emerald-300 transition-colors text-xs sm:text-sm">
                  {awayTeam.name}
                </span>
              </Link>
              <div className="flex flex-col items-center gap-0.5 min-h-[3.4rem]">
                {awayScorers.map((s, i) => {
                  const pid = playerIds[normName(s.name)];
                  const cls = "text-[0.65rem] text-emerald-400 hover:underline whitespace-nowrap";
                  return pid ? (
                    <Link key={`${s.name}-${s.minute}-${i}`} to={`/joueurs/${pid}`} className={cls}>
                      ⚽ {shortName(s.name)} <span className="text-gray-500">{s.minute}{s.own ? " (csc)" : ""}</span>
                    </Link>
                  ) : (
                    <span key={`${s.name}-${s.minute}-${i}`} className={cls}>⚽ {shortName(s.name)} <span className="text-gray-500">{s.minute}{s.own ? " (csc)" : ""}</span></span>
                  );
                })}
              </div>
            </div>
          </div>

          {(match.venue || match.referee) && (
            <div className="flex items-center justify-center gap-1.5 mt-5 text-[0.7rem] text-gray-500">
              {match.venue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10">
                  <RiMapPinLine className="text-emerald-500 text-xs" />
                  {match.venue}
                  {match.city ? `, ${match.city}` : ""}
                </span>
              )}
              {match.referee && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10">
                  <RiUserLine className="text-emerald-500 text-xs" />
                  {match.referee}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <section className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-5 sm:p-6 fa-fade-up fa-fade-up-1">
          <div className="flex items-center gap-2 mb-5 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-sm font-semibold whitespace-nowrap rounded-full transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? "bg-emerald-500 text-white"
                    : "fa-tab-inactive bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "buteurs" && (
            <ol>
              {scorerEvents.map((e, i) => {
                const pid = playerIds[normName(e.player)];
                const missed = isPenaltyMiss(e);
                return (
                  <li key={i} className="pb-5 last:pb-1">
                    <div className="flex items-baseline gap-3">
                      <span className="w-5 shrink-0 flex items-center justify-center self-start pt-0.5">
                        {missed ? (
                          <span className="text-[0.8rem] leading-none">❌</span>
                        ) : (
                          <span className="text-[0.8rem] leading-none">⚽</span>
                        )}
                      </span>
                      <span className={`w-9 shrink-0 text-right text-[0.7rem] font-semibold tabular-nums ${missed ? "text-red-500" : "text-emerald-600"}`}>
                        {eventMinute(e)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          {pid ? (
                            <Link
                              to={`/joueurs/${pid}`}
                              className={`font-medium hover:underline ${missed ? "fa-ink" : "fa-ink--goal"}`}
                            >
                              {e.player}
                            </Link>
                          ) : (
                            <span className={`font-medium ${missed ? "fa-ink" : "fa-ink--goal"}`}>
                              {e.player}
                            </span>
                          )}
                          {e.assist && (
                            <span className="text-gray-400">
                              {" "}
                              · {t("passe à")} {e.assist}
                            </span>
                          )}
                        </p>
                        <p className="text-[0.7rem] text-gray-400 mt-0.5">
                          {e.team} — {t(e.detail ?? "")}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {activeTab === "chronologie" && (
            <Timeline events={events} playerIds={playerIds} />
          )}

          {activeTab === "statistiques" && (
            <div>
              {statKeys.map(k => (
                <StatBar
                  key={k}
                  label={k}
                  home={homeStats[k]}
                  away={awayStats[k]}
                />
              ))}
            </div>
          )}

          {activeTab === "compositions" && (
            <div>
              <div className="flex items-center justify-end mb-3">
                <ImageDownloadButton
                  getNode={() => pitchRef.current}
                  filename={`composition-${homeTeam.name}-vs-${awayTeam.name}`}
                />
              </div>
              {homeLineup && awayLineup && (
                <div className="flex items-center gap-2 mb-5 overflow-x-auto">
                  {[
                    { id: "home", lineup: homeLineup },
                    { id: "away", lineup: awayLineup },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTeamTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold whitespace-nowrap rounded-full transition-colors cursor-pointer ${
                        teamTab === t.id
                          ? "bg-emerald-500 text-white"
                          : "fa-tab-inactive bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                      }`}
                    >
                      <TeamLogo
                        logo={t.lineup.team.logo}
                        name={t.lineup.team.name}
                        size="w-4 h-4"
                      />
                      {t.lineup.team.name}
                    </button>
                  ))}
                </div>
              )}
              {activeLineup ? (
                <div>
                  <p className="text-center text-xs text-gray-500 mb-1">
                    {activeLineup.formation ?? ""}
                    {activeLineup.coach ? ` · ${t("Coach :")} ${activeLineup.coach}` : ""}
                  </p>
                  {(activeLineup.startXI ?? []).length ? (
                    <div ref={pitchRef}>
                      <PitchView
                        lineup={activeLineup}
                        scorers={scorers}
                        assisters={assisters}
                        players={playerInfo}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm py-6 text-center">
                      {t("Composition non disponible pour ce match.")}
                    </p>
                  )}
                  {(activeLineup.substitutes ?? []).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">
                        {t("Remplaçants")}
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                        {activeLineup.substitutes.map(p => {
                          const info =
                            playerInfo[normName(p.name)] ?? {};
                          const pid = info.id ?? p.id;
                          const flag = countryFlag(info.nationality);
                          return (
                          <li
                            key={p.id}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <span className="w-6 text-center text-[0.65rem] text-gray-400 tabular-nums">
                              {p.number ?? ""}
                            </span>
                            <TeamLogo
                              logo={info.photo ?? p.photo}
                              name={p.name}
                              size="w-5 h-5"
                              cover
                              className="rounded-full"
                            />
                            {flag && <span className="text-xs">{flag}</span>}
                            {pid ? (
                              <Link
                                to={`/joueurs/${pid}`}
                                className={`truncate hover:text-emerald-600 ${
                                  scorers[normName(p.name)]
                                    ? "text-emerald-600 font-bold"
                                    : ""
                                }`}
                              >
                                {p.name}
                              </Link>
                            ) : (
                              <span className="truncate">{p.name}</span>
                            )}
                            {scorers[normName(p.name)] && (
                              <RiFootballLine className="text-emerald-600 shrink-0" />
                            )}
                            {assisters[normName(p.name)] && (
                              <RiGiftLine className="text-sky-500 shrink-0" />
                            )}
                          </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-4 text-center">
                  {t("Composition non disponible pour cette équipe.")}
                </p>
              )}
            </div>
          )}
        </section>

      </div>
    </Container>
  );
};

export default MatchCenter;
