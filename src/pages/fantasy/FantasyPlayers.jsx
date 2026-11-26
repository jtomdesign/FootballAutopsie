import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFantasySeason, useFantasyPlayers } from "../../hooks/fantasy";
import { PlayerCard } from "./components";

const FantasyPlayers = () => {
  const { t } = useTranslation();
  const { season } = useFantasySeason();

  const [pos, setPos] = useState("");
  const [club, setClub] = useState("");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("points");

  const { data, isLoading } = useFantasyPlayers({
    seasonId: season?.id,
    apiLeagueId: season?.comp?.api_league_id,
    position: pos || undefined,
    clubApiId: club ? Number(club) : undefined,
    minPrice: minP ? Number(minP) : undefined,
    maxPrice: maxP ? Number(maxP) : undefined,
    search,
    sort,
    limit: 120,
    enabled: !!season,
  });

  const players = data?.players ?? [];
  const clubs = useMemo(() => {
    const map = new Map();
    players.forEach(p => {
      if (p.club_api_id && p.club_name) map.set(p.club_api_id, p.club_name);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [players]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-2xl bg-emerald-950/60 p-4 flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("Rechercher un joueur…")}
          className="rounded-lg fa-input px-3 py-2 text-sm flex-1 min-w-[180px]"
        />
        <div className="flex gap-1">
          {["", "G", "D", "M", "F"].map(p => (
            <button
              key={p}
              onClick={() => setPos(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                pos === p ? "bg-emerald-600 text-white" : "bg-white/5 text-gray-500"
              }`}
            >
              {p || t("Tous")}
            </button>
          ))}
        </div>
        <select
          value={club}
          onChange={e => setClub(e.target.value)}
          className="rounded-lg fa-input px-2 py-1.5 text-sm"
        >
          <option value="">{t("Tous les clubs")}</option>
          {clubs.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <input
          value={minP}
          onChange={e => setMinP(e.target.value)}
          placeholder="Min £"
          type="number"
          step="0.5"
          className="w-20 rounded-lg fa-input px-2 py-1.5 text-sm"
        />
        <input
          value={maxP}
          onChange={e => setMaxP(e.target.value)}
          placeholder="Max £"
          type="number"
          step="0.5"
          className="w-20 rounded-lg fa-input px-2 py-1.5 text-sm"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="rounded-lg fa-input px-2 py-1.5 text-sm"
        >
          <option value="points">{t("Points")}</option>
          <option value="price_desc">{t("Prix ↓")}</option>
          <option value="price_asc">{t("Prix ↑")}</option>
          <option value="name">{t("Nom")}</option>
        </select>
      </div>

      <p className="text-xs text-gray-400">
        {isLoading ? t("Chargement…") : `${players.length} ${t("joueurs")}`}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {players.map(p => (
          <PlayerCard key={p.id} player={p} />
        ))}
      </div>
      {!isLoading && !players.length && (
        <div className="rounded-2xl bg-emerald-950/60 p-10 text-center text-gray-500">
          {t("Aucun joueur ne correspond aux filtres.")}
        </div>
      )}
    </div>
  );
};

export default FantasyPlayers;
