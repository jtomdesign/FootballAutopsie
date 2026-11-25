import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../services/supabase";
import {
  useFantasyComps,
  useScoringRules,
  useSyncFantasyPlayers,
} from "../../hooks/fantasy";
import Button from "../../ui/Button";
import { LuRefreshCw, LuPlus, LuPlay } from "react-icons/lu";

const inputCls =
  "rounded-lg border border-gray-200 px-3 py-2 text-sm w-full";

const Section = ({ title, children }) => (
  <div className="rounded-2xl bg-white border border-gray-200 p-5">
    <h3 className="font-black text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const FantasyAdmin = () => {
  const { data: comps, refetch: refetchComps } = useFantasyComps();
  const { data: rules, refetch: refetchRules } = useScoringRules();
  const syncPlayers = useSyncFantasyPlayers();

  const [counts, setCounts] = useState({});
  const [newSeason, setNewSeason] = useState({ compId: "", apiSeason: "", name: "" });
  const [newGw, setNewGw] = useState({ seasonId: "", number: "", deadline: "" });
  const [rulesText, setRulesText] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const seasons = useMemo(
    () =>
      (comps ?? []).flatMap(c =>
        (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })),
      ),
    [comps],
  );

  const loadCounts = async () => {
    const tables = ["fantasy_teams", "fantasy_players", "fantasy_gameweeks", "fantasy_transfers"];
    const out = {};
    for (const t of tables) {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      out[t] = count ?? 0;
    }
    setCounts(out);
  };
  React.useEffect(() => { loadCounts(); }, []);

  const createSeason = async () => {
    if (!newSeason.compId || !newSeason.apiSeason || !newSeason.name) {
      return toast.error("Compétition, saison API et nom requis");
    }
    const { error } = await supabase.from("fantasy_seasons").insert({
      comp_id: Number(newSeason.compId),
      api_season: Number(newSeason.apiSeason),
      name: newSeason.name,
      status: "draft",
    });
    if (error) return toast.error(error.message);
    toast.success("Saison créée");
    setNewSeason({ compId: "", apiSeason: "", name: "" });
    refetchComps();
  };

  const setSeasonStatus = async (id, status) => {
    const { error } = await supabase
      .from("fantasy_seasons")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Saison → ${status}`);
    refetchComps();
  };

  const createGw = async () => {
    if (!newGw.seasonId || !newGw.number || !newGw.deadline) {
      return toast.error("Saison, numéro et deadline requis");
    }
    const { error } = await supabase.from("fantasy_gameweeks").insert({
      season_id: Number(newGw.seasonId),
      number: Number(newGw.number),
      deadline: new Date(newGw.deadline).toISOString(),
      status: "upcoming",
    });
    if (error) return toast.error(error.message);
    toast.success("Gameweek créée");
    setNewGw({ seasonId: "", number: "", deadline: "" });
    refetchComps();
  };

  const setGwStatus = async (id, status) => {
    const { error } = await supabase
      .from("fantasy_gameweeks")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    refetchComps();
  };

  const loadFixtures = async (gw) => {
    const season = seasons.find(s =>
      (s.fantasy_gameweeks ?? []).some(g => g.id === gw.id),
    );
    if (!season) return;
    try {
      const res = await fetch(
        `/api/football?path=/fixtures&league=${season.comp.api_league_id}&season=${season.api_season}&round=${gw.number}`,
      );
      const json = await res.json();
      const ids = (json?.response ?? []).map(f => f.fixture?.id).filter(Boolean);
      if (!ids.length) return toast.error("Aucun fixture pour ce round");
      const { error } = await supabase
        .from("fantasy_gameweeks")
        .update({ fixture_ids: ids })
        .eq("id", gw.id);
      if (error) return toast.error(error.message);
      toast.success(`${ids.length} fixtures associées`);
      refetchComps();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const runPlayerSync = async comp => {
    const season = (comp.fantasy_seasons ?? []).sort((a, b) => b.api_season - a.api_season)[0];
    if (!season) return toast.error("Créez d'abord une saison");
    try {
      const n = await syncPlayers.mutateAsync({
        compApiLeagueId: comp.api_league_id,
        apiSeason: season.api_season,
      });
      toast.success(`${n} joueurs synchronisés`);
      loadCounts();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const runPointsSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/fantasy-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      toast.success(
        `Sync OK — ${json.fixturesProcessed} fixtures, ${json.managerRows} managers`,
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const saveRules = async () => {
    try {
      const parsed = JSON.parse(rulesText ?? JSON.stringify(rules ?? {}));
      const { error } = await supabase
        .from("fantasy_scoring_rules")
        .upsert({ id: 1, rules: parsed, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("Règles enregistrées");
      setRulesText(null);
      refetchRules();
    } catch (e) {
      toast.error(`JSON invalide: ${e.message}`);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries({
          "Équipes": counts.fantasy_teams,
          "Joueurs": counts.fantasy_players,
          "Gameweeks": counts.fantasy_gameweeks,
          "Transferts": counts.fantasy_transfers,
        }).map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-white border border-gray-200 p-4">
            <p className="text-2xl font-black text-gray-900">{v ?? "—"}</p>
            <p className="text-xs text-gray-500 font-bold uppercase">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button name="Synchroniser les points" type="primary" icon={<LuPlay />}
          onClick={runPointsSync} />
        <Button name="Actualiser" type="simple" icon={<LuRefreshCw />}
          onClick={() => { loadCounts(); refetchComps(); }} />
      </div>

      {/* Competitions & players */}
      <Section title="Compétitions & joueurs">
        <div className="space-y-4">
          {(comps ?? []).map(comp => (
            <div key={comp.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="font-bold text-gray-900">{comp.name}</p>
                <Button name="Sync joueurs" type="simple" icon={<LuRefreshCw />}
                  onClick={() => runPlayerSync(comp)} />
              </div>
              <div className="space-y-2">
                {(comp.fantasy_seasons ?? []).map(s => (
                  <div key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-800">{s.name}</span>
                    <span className="text-xs text-gray-400">API {s.api_season}</span>
                    <select
                      value={s.status}
                      onChange={e => setSeasonStatus(s.id, e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    >
                      {["draft", "active", "completed", "archived"].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-400 ml-auto">
                      {(s.fantasy_gameweeks ?? []).length} GW
                    </span>
                  </div>
                ))}
                {!comp.fantasy_seasons?.length && (
                  <p className="text-xs text-gray-400">Aucune saison — créez-en une ci-dessous.</p>
                )}
                {(s => s)(comp.fantasy_seasons?.[0]) && null}
              </div>
            </div>
          ))}
        </div>

        {/* New season */}
        <div className="mt-5 pt-4 border-t border-gray-100 grid sm:grid-cols-4 gap-2 items-end">
          <select className={inputCls} value={newSeason.compId}
            onChange={e => setNewSeason(v => ({ ...v, compId: e.target.value }))}>
            <option value="">Compétition…</option>
            {(comps ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className={inputCls} placeholder="Saison API (ex: 2025)" type="number"
            value={newSeason.apiSeason}
            onChange={e => setNewSeason(v => ({ ...v, apiSeason: e.target.value }))} />
          <input className={inputCls} placeholder="Nom (ex: 2025/2026)"
            value={newSeason.name}
            onChange={e => setNewSeason(v => ({ ...v, name: e.target.value }))} />
          <Button name="Créer saison" type="secondary" icon={<LuPlus />}
            onClick={createSeason} />
        </div>
      </Section>

      {/* Gameweeks */}
      <Section title="Gameweeks">
        <div className="grid sm:grid-cols-4 gap-2 items-end mb-4">
          <select className={inputCls} value={newGw.seasonId}
            onChange={e => setNewGw(v => ({ ...v, seasonId: e.target.value }))}>
            <option value="">Saison…</option>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.comp?.name} {s.name}</option>
            ))}
          </select>
          <input className={inputCls} placeholder="N°" type="number"
            value={newGw.number}
            onChange={e => setNewGw(v => ({ ...v, number: e.target.value }))} />
          <input className={inputCls} type="datetime-local"
            value={newGw.deadline}
            onChange={e => setNewGw(v => ({ ...v, deadline: e.target.value }))} />
          <Button name="Créer GW" type="secondary" icon={<LuPlus />}
            onClick={createGw} />
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {seasons.map(s => (
            <div key={s.id}>
              <p className="text-xs font-black uppercase text-gray-400 mb-2">
                {s.comp?.name} {s.name}
              </p>
              {(s.fantasy_gameweeks ?? []).map(gw => (
                <div key={gw.id} className="flex flex-wrap items-center gap-2 text-sm py-1.5 border-b border-gray-50">
                  <span className="font-bold text-gray-800">GW{gw.number}</span>
                  <span className="text-xs text-gray-400">
                    {gw.deadline ? new Date(gw.deadline).toLocaleString("fr-FR") : ""}
                  </span>
                  <span className="text-xs text-gray-400">
                    {(gw.fixture_ids ?? []).length} fixtures
                  </span>
                  <select
                    value={gw.status}
                    onChange={e => setGwStatus(gw.id, e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  >
                    {["upcoming", "open", "deadline_passed", "live", "processing", "completed"].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadFixtures(gw)}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Charger fixtures
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Scoring rules */}
      <Section title="Règles de scoring">
        <textarea
          className={`${inputCls} font-mono text-xs h-64`}
          value={rulesText ?? JSON.stringify(rules ?? {}, null, 2)}
          onChange={e => setRulesText(e.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <Button name="Enregistrer" type="primary" onClick={saveRules} />
          {rulesText != null && (
            <Button name="Annuler" type="simple"
              onClick={() => setRulesText(null)} />
          )}
        </div>
      </Section>
    </div>
  );
};

export default FantasyAdmin;
