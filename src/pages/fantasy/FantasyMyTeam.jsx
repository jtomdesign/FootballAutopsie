import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useFantasyComps,
  useMyTeam,
  useActiveGameweek,
  useFantasyPlayers,
  useFantasyCreateTeam,
  useFantasySetLineup,
} from "../../hooks/fantasy";
import Button from "../../ui/Button";
import { PositionBadge, PlayerCard } from "./components";
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
  const [name, setName] = useState("");
  const [squad, setSquad] = useState([]); // selected player objects
  const [posFilter, setPosFilter] = useState("G");
  const [search, setSearch] = useState("");
  const create = useFantasyCreateTeam();

  const { data: playersData } = useFantasyPlayers({
    seasonId: season.id,
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
    <div className="rounded-2xl bg-white border border-gray-200 p-6">
      <h2 className="text-xl font-black text-gray-900">{t("Créer mon équipe")}</h2>
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
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {p}: {counts[p] ?? 0}/{QUOTAS[p]}
          </span>
        ))}
        <span className="ml-auto text-emerald-600">
          £{remaining.toFixed(1)}m {t("restants")}
        </span>
      </div>

      <div className="mt-4 grid sm:grid-cols-[220px_1fr] gap-4">
        <div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("Nom de l'équipe")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3"
          />
          <div className="flex gap-1 mb-2">
            {["G", "D", "M", "F"].map(p => (
              <button
                key={p}
                onClick={() => setPosFilter(p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black ${
                  posFilter === p
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-500"
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
  const lineupRows = team.lineup ?? [];
  const lineupMap = new Map(lineupRows.map(l => [l.player_id, l]));

  const byPos = pos => squad.filter(p => p.position === pos);

  // Auto-pick XI: GK + formation counts, bench = rest ordered by position
  const autoLineup = () => {
    const gks = byPos("G");
    const defs = byPos("D");
    const mids = byPos("M");
    const fwds = byPos("F");
    const starters = [
      ...(gks[0] ? [gks[0]] : []),
      ...defs.slice(0, formation.d),
      ...mids.slice(0, formation.m),
      ...fwds.slice(0, formation.f),
    ];
    const starterIds = new Set(starters.map(p => p.id));
    const bench = squad.filter(p => !starterIds.has(p.id));
    return { starters, bench };
  };

  const [auto] = useState(autoLineup);
  const starters = lineupRows.length
    ? squad.filter(p => lineupMap.get(p.id)?.slot !== "bench")
    : auto.starters;
  const bench = lineupRows.length
    ? squad
        .filter(p => lineupMap.get(p.id)?.slot === "bench")
        .sort(
          (a, b) =>
            (lineupMap.get(a.id)?.bench_order ?? 99) -
            (lineupMap.get(b.id)?.bench_order ?? 99),
        )
    : auto.bench;

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
            ? "border-amber-400 bg-amber-50"
            : isVc
              ? "border-sky-300 bg-sky-50"
              : "border-gray-200 bg-white"
        }`}
      >
        <span className="text-xs font-black text-gray-400 w-5">{index + 1}</span>
        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
          {p.photo && (
            <img src={p.photo} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">
            {p.name}
            {isCap && <LuCrown className="text-amber-500 w-4 h-4" />}
            {isVc && <LuCrown className="text-sky-400 w-3.5 h-3.5" />}
          </p>
          <p className="text-xs text-gray-500 truncate">{p.club_name}</p>
        </div>
        <PositionBadge position={p.position} />
        <span className="text-xs font-black text-emerald-600">
          £{Number(p.price ?? p.price_paid).toFixed(1)}m
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">{team.name}</h2>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-black ${
                formation.id === f.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-gray-200 text-gray-500"
              }`}
            >
              {f.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <h3 className="font-black text-gray-900 mb-3">
            {t("Titulaire")}
            <span className="text-xs font-normal text-gray-400 ml-2">
              {t("Cliquer pour nommer capitaine / vice-capitaine")}
            </span>
          </h3>
          <div className="space-y-2">
            {starters.map((p, i) => (
              <PlayerRow key={p.id} p={p} isStarter index={i} />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <h3 className="font-black text-gray-900 mb-3">
              {t("Remplaçants")}
            </h3>
            <div className="space-y-2">
              {bench.map((p, i) => (
                <PlayerRow key={p.id} p={p} index={i} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-950 text-white p-4 flex items-center justify-between">
            <div className="text-sm">
              <p className="font-bold">{t("Capitaine")}</p>
              <p className="text-emerald-200/70 text-xs">
                {squad.find(p => p.id === capId)?.name ?? "—"} · ×2
              </p>
            </div>
            <div className="text-sm text-right">
              <p className="font-bold">{t("Vice-capitaine")}</p>
              <p className="text-emerald-200/70 text-xs">
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
  const { data: comps } = useFantasyComps();
  const season = useMemo(
    () =>
      (comps ?? [])
        .flatMap(c => (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })))
        .find(s => s.status === "active") ?? null,
    [comps],
  );
  const { data: team, isLoading, refetch } = useMyTeam(season?.id);
  const { data: gw } = useActiveGameweek(season?.id);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center">
        <p className="text-gray-600">{t("Connectez-vous pour gérer votre équipe fantasy.")}</p>
        <Link to="/compte" className="text-emerald-600 font-bold text-sm mt-2 inline-block">
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
