import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useFantasySeason,
  useMyTeam,
  useActiveGameweek,
  useFantasyPlayers,
  useFantasyCreateTeam,
  useFantasySetLineup,
} from "../../hooks/fantasy";
import Button from "../../ui/Button";
import { PositionBadge, PlayerCard } from "./components";
import Pitch from "./Pitch";
import { LuCrown, LuArrowLeft, LuCheck } from "react-icons/lu";

const FORMATIONS = [
  { id: "3-4-3", d: 3, m: 4, f: 3 },
  { id: "3-5-2", d: 3, m: 5, f: 2 },
  { id: "4-3-3", d: 4, m: 3, f: 3 },
  { id: "4-4-2", d: 4, m: 4, f: 2 },
  { id: "4-5-1", d: 4, m: 5, f: 1 },
  { id: "5-3-2", d: 5, m: 3, f: 2 },
  { id: "5-4-1", d: 5, m: 4, f: 1 },
];

const QUOTAS = { G: 2, D: 5, M: 5, F: 3 };

const ClubCount = players => {
  const counts = {};
  players.forEach(p => {
    const k = p.club_api_id ?? p.club_name;
    counts[k] = (counts[k] ?? 0) + 1;
  });
  return counts;
};

// ---------- Create team wizard ----------

const CreateTeam = ({ season, onCreated }) => {
  const { t } = useTranslation();
  const { user } = useSelector(s => s.user);
  const [name, setName] = useState("");
  const [squad, setSquad] = useState([]); // selected player objects
  const [posFilter, setPosFilter] = useState("G");
  const [search, setSearch] = useState("");
  const create = useFantasyCreateTeam();

  const { data: playersData } = useFantasyPlayers({
    seasonId: season.id,
    apiLeagueId: season.comp?.api_league_id,
    position: posFilter,
    search,
    limit: 100,
    enabled: !!season,
  });
  const players = playersData?.players ?? [];
  const selected = squad.map(p => p.id);

  const counts = useMemo(() => {
    const c = { G: 0, D: 0, M: 0, F: 0 };
    squad.forEach(p => (c[p.position] = (c[p.position] ?? 0) + 1));
    return c;
  }, [squad]);

  const totalCost = squad.reduce((a, p) => a + Number(p.price), 0);
  const budget = Number(season.budget ?? 100);
  const remaining = budget - totalCost;
  const clubCounts = ClubCount(squad);
  const maxClub = season.max_per_club ?? 3;

  const toggle = p => {
    setSquad(prev => {
      if (prev.some(q => q.id === p.id))
        return prev.filter(q => q.id !== p.id);
      if (prev.length >= (season.squad_size ?? 15)) {
        toast.error(t("Effectif complet (15 joueurs)"));
        return prev;
      }
      const cnt = ClubCount(prev)[p.club_api_id ?? p.club_name] ?? 0;
      if (cnt >= maxClub) {
        toast.error(t("Max {{n}} joueurs par club", { n: maxClub }));
        return prev;
      }
      const cost = prev.reduce((a, q) => a + Number(q.price), 0);
      if (cost + Number(p.price) > budget) {
        toast.error(t("Budget dépassé"));
        return prev;
      }
      const posCount = prev.filter(q => q.position === p.position).length;
      if (posCount >= QUOTAS[p.position]) {
        toast.error(t("Quota {{pos}} atteint", { pos: p.position }));
        return prev;
      }
      return [...prev, p];
    });
  };

  const submit = async () => {
    try {
      await create.mutateAsync({
        seasonId: season.id,
    apiLeagueId: season.comp?.api_league_id,
        name: name || `Team ${user?.name ?? ""}`.trim(),
        playerIds: selected,
      });
      toast.success(t("Équipe créée !"));
      onCreated?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const validSquad =
    selected.length === (season.squad_size ?? 15) &&
    ["G", "D", "M", "F"].every(p => counts[p] === QUOTAS[p]) &&
    totalCost <= budget &&
    Object.values(clubCounts).every(c => c <= maxClub);

  return (
    <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-6">
      <h2 className="text-xl font-bold text-gray-100">{t("Créer mon équipe")}</h2>
      <p className="text-sm text-gray-500 mt-1">
        {season.comp?.name} · {season.name} — £{budget}m, 15 joueurs (2G 5D 5M 3F)
      </p>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-2 text-xs font-bold">
        {["G", "D", "M", "F"].map(p => (
          <span
            key={p}
            className={`px-3 py-1 rounded-full ${
              counts[p] === QUOTAS[p]
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-white/5 text-gray-500"
            }`}
          >
            {p}: {counts[p] ?? 0}/{QUOTAS[p]}
          </span>
        ))}
        <span className="ml-auto text-emerald-400">
          £{remaining.toFixed(1)}m {t("restants")}
        </span>
      </div>

      <div className="mt-4 grid sm:grid-cols-[220px_1fr] gap-4">
        <div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("Nom de l'équipe")}
            className="w-full rounded-lg fa-input px-3 py-2 text-sm mb-3"
          />
          <div className="flex gap-1 mb-2">
            {["G", "D", "M", "F"].map(p => (
              <button
                key={p}
                onClick={() => setPosFilter(p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                  posFilter === p
                    ? "bg-emerald-600 text-white"
                    : "bg-white/5 text-gray-500"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("Rechercher…")}
            className="w-full rounded-lg fa-input px-3 py-2 text-sm"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
          {players.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={selected.includes(p.id)}
              onClick={() => toggle(p)}
            />
          ))}
          {!players.length && (
            <p className="text-sm text-gray-400 col-span-2 text-center py-6">
              {t("Aucun joueur — synchronisez le roster (admin).")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {selected.length}/{season.squad_size ?? 15} {t("joueurs")}
        </p>
        <Button
          name={validSquad ? t("Valider l'équipe") : t("Sélection invalide")}
          type={validSquad ? "primary" : "simple"}
          onClick={submit}
          icon={<LuCheck />}
        />
      </div>
    </div>
  );
};

// ---------- My Team (existing) ----------

const MyTeamView = ({ team, season, gw }) => {
  const { t } = useTranslation();
  const setLineup = useFantasySetLineup();
  const [formation, setFormation] = useState(FORMATIONS[3]); // 4-4-2
  const [captain, setCaptain] = useState(null);
  const [vc, setVc] = useState(null);

  const squad = (team.squad ?? []).map(s => ({
    ...s.fantasy_players,
    price_paid: s.price_paid,
  }));
  const lineupRows = (team.lineup ?? []).filter(
    l => !gw || l.gw === gw.number,
  );
  const lineupMap = new Map(lineupRows.map(l => [l.player_id, l]));

  const byPos = pos => squad.filter(p => p.position === pos);

  // XI derived from the selected formation; bench = remaining players,
  // best performers first (bench_order feeds auto-substitution priority)
  const { starters, bench } = useMemo(() => {
    const gks = byPos("G");
    const defs = byPos("D");
    const mids = byPos("M");
    const fwds = byPos("F");
    const st = [
      ...(gks[0] ? [gks[0]] : []),
      ...defs.slice(0, formation.d),
      ...mids.slice(0, formation.m),
      ...fwds.slice(0, formation.f),
    ];
    const stIds = new Set(st.map(p => p.id));
    const bn = squad
      .filter(p => !stIds.has(p.id))
      .sort(
        (a, b) =>
          (Number(b.totalPoints ?? 0) + Number(b.lastGwPoints ?? 0)) -
          (Number(a.totalPoints ?? 0) + Number(a.lastGwPoints ?? 0)),
      );
    return { starters: st, bench: bn };
  }, [squad, formation]);

  const capId =
    captain ??
    squad.find(p => lineupMap.get(p.id)?.is_captain)?.id ??
    starters[0]?.id;
  const vcId =
    vc ?? squad.find(p => lineupMap.get(p.id)?.is_vc)?.id ?? null;

  const saveLineup = async () => {
    if (!gw) return toast.error(t("Aucune journée active"));
    try {
      await setLineup.mutateAsync({
        teamId: team.id,
        gw: gw.number,
        starters: starters.map(p => p.id),
        benchOrder: bench.map(p => p.id),
        captain: capId,
        vc: vcId,
      });
      toast.success(t("Composition enregistrée"));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const PlayerRow = ({ p, isStarter, index }) => {
    const isCap = p.id === capId;
    const isVc = p.id === vcId;
    return (
      <div
        onClick={() => {
          if (isCap) setVc(isVc ? null : p.id);
          else setCaptain(p.id);
        }}
        className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-colors ${
          isCap
            ? "border-amber-400 bg-amber-500/10"
            : isVc
              ? "border-sky-500/40 bg-sky-500/10"
              : "border-white/10 bg-white/5"
        }`}
      >
        <span className="text-xs font-bold text-gray-400 w-5">{index + 1}</span>
        <div className="w-9 h-9 rounded-full bg-white/5 overflow-hidden shrink-0">
          {p.photo && (
            <img src={p.photo} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-100 truncate flex items-center gap-1">
            {p.name}
            {isCap && <LuCrown className="text-amber-500 w-4 h-4" />}
            {isVc && <LuCrown className="text-sky-400 w-3.5 h-3.5" />}
          </p>
          <p className="text-xs text-gray-500 truncate">{p.club_name}</p>
        </div>
        <PositionBadge position={p.position} />
        <span className="text-xs font-bold text-emerald-400">
          £{Number(p.price ?? p.price_paid).toFixed(1)}m
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-100">{team.name}</h2>
          <p className="text-sm text-gray-500">
            {season?.comp?.name} · {season?.name} ·{" "}
            {t("{{pts}} points", { pts: team.total_points ?? 0 })}
          </p>
        </div>
        <div className="flex gap-2">
          {FORMATIONS.map(f => (
            <button
              key={f.id}
              onClick={() => setFormation(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                formation.id === f.id
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-950/60 border border-emerald-900/60 text-gray-500"
              }`}
            >
              {f.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-4">
          <h3 className="font-bold text-gray-100 mb-3">
            {t("Composition")}
            <span className="text-xs font-normal text-gray-400 ml-2">
              {t("Cliquer un joueur pour capitaine / vice-capitaine")}
            </span>
          </h3>
          <Pitch
            starters={starters}
            capId={capId}
            vcId={vcId}
            formation={formation}
            onPick={p => {
              if (p.id === capId) setVc(vcId === p.id ? null : p.id);
              else setCaptain(p.id);
            }}
          />
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-4">
            <h3 className="font-bold text-gray-100 mb-3">
              {t("Remplaçants")}
            </h3>
            <div className="space-y-2">
              {bench.map((p, i) => (
                <PlayerRow key={p.id} p={p} index={i} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-gray-100 p-4 flex items-center justify-between">
            <div className="text-sm">
              <p className="font-bold">{t("Capitaine")}</p>
              <p className="text-gray-400 text-xs">
                {squad.find(p => p.id === capId)?.name ?? "—"} · ×2
              </p>
            </div>
            <div className="text-sm text-right">
              <p className="font-bold">{t("Vice-capitaine")}</p>
              <p className="text-gray-400 text-xs">
                {squad.find(p => p.id === vcId)?.name ?? t("Aucun")}
              </p>
            </div>
          </div>
          <Button
            name={setLineup.isPending ? t("Enregistrement…") : t("Enregistrer la composition")}
            type="primary"
            onClick={saveLineup}
            icon={<LuCheck />}
          />
        </div>
      </div>
    </div>
  );
};

// ---------- Page ----------

const FantasyMyTeam = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector(s => s.user);
  const { season } = useFantasySeason();
  const { data: team, isLoading, refetch } = useMyTeam(season?.id);
  const { data: gw } = useActiveGameweek(season?.id);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-10 text-center">
        <p className="text-gray-400">{t("Connectez-vous pour gérer votre équipe fantasy.")}</p>
        <Link to="/compte" className="text-emerald-400 font-bold text-sm mt-2 inline-block">
          {t("Se connecter")}
        </Link>
      </div>
    );
  }
  if (isLoading) return <p className="text-gray-500 py-10 text-center">{t("Chargement…")}</p>;
  if (!season) return <p className="text-gray-500 py-10 text-center">{t("Aucune saison active.")}</p>;

  if (!team) return <CreateTeam season={season} onCreated={refetch} />;

  return <MyTeamView team={team} season={season} gw={gw} />;
};

export default FantasyMyTeam;
