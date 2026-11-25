import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useFantasyComps,
  useMyTeam,
  useFantasyPlayers,
  useFantasyTransfer,
} from "../../hooks/fantasy";
import Button from "../../ui/Button";
import { PositionBadge } from "./components";
import { LuArrowLeftRight, LuX } from "react-icons/lu";
import { notify } from "../../services/user";

const Transfers = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useSelector(s => s.user);
  const { data: comps } = useFantasyComps();
  const season = useMemo(
    () =>
      (comps ?? [])
        .flatMap(c => (c.fantasy_seasons ?? []).map(s => ({ ...s, comp: c })))
        .find(s => s.status === "active") ?? null,
    [comps],
  );
  const { data: team, isLoading } = useMyTeam(season?.id);
  const transfer = useFantasyTransfer();

  const [posFilter, setPosFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sellPick, setSellPick] = useState(null); // player object to sell
  const [buyPick, setBuyPick] = useState(null);

  const { data: playersData } = useFantasyPlayers({
    seasonId: season?.id,
    position: posFilter || undefined,
    search,
    limit: 80,
    enabled: !!season && !!team,
  });
  const players = playersData?.players ?? [];

  const squad = (team?.squad ?? []).map(s => ({
    ...s.fantasy_players,
    price_paid: s.price_paid,
  }));

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center">
        <p className="text-gray-600">{t("Connectez-vous pour effectuer des transferts.")}</p>
        <Link to="/compte" className="text-emerald-600 font-bold text-sm mt-2 inline-block">
          {t("Se connecter")}
        </Link>
      </div>
    );
  }
  if (isLoading) return <p className="text-gray-500 py-10 text-center">{t("Chargement…")}</p>;
  if (!team) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center">
        <p className="text-gray-600">{t("Créez d'abord votre équipe.")}</p>
        <Link to="/fantasy/equipe" className="text-emerald-600 font-bold text-sm mt-2 inline-block">
          {t("Mon équipe")}
        </Link>
      </div>
    );
  }

  const confirmTransfer = async () => {
    if (!sellPick || !buyPick) return;
    try {
      await transfer.mutateAsync({
        teamId: team.id,
        outPlayerId: sellPick.id,
        inPlayerId: buyPick.id,
      });
      toast.success(t("Transfert effectué"));
      notify({
        userId: user?.id,
        type: "fantasy_transfer",
        title: "Transfert fantasy",
        message: `${sellPick?.name} → ${buyPick?.name}`,
        targetUrl: "/fantasy/equipe",
      }).catch(() => {});
      setSellPick(null);
      setBuyPick(null);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const costDelta = sellPick && buyPick
    ? Number(buyPick.price) - Number(sellPick.price ?? sellPick.price_paid)
    : 0;
  const freeLeft = team.free_transfers ?? 0;
  const deduction = freeLeft > 0 ? 0 : (season?.extra_transfer_cost ?? 4);

  const PlayerRow = ({ p, side }) => (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5">
      <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
        {p.photo && <img src={p.photo} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
        <p className="text-xs text-gray-500 truncate">{p.club_name}</p>
      </div>
      <PositionBadge position={p.position} />
      <span className="text-xs font-black text-emerald-600">
        £{Number(p.price ?? p.price_paid).toFixed(1)}m
      </span>
      <button
        onClick={() => (side === "sell" ? setSellPick(p) : setBuyPick(p))}
        className="ml-1 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {side === "sell" ? t("Vendre") : t("Acheter")}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="rounded-2xl bg-emerald-950 text-white p-4 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-emerald-300/70 text-xs uppercase font-bold">{t("Budget")}</p>
          <p className="font-black">£{Number(team.budget ?? 0).toFixed(1)}m</p>
        </div>
        <div>
          <p className="text-emerald-300/70 text-xs uppercase font-bold">{t("Transferts libres")}</p>
          <p className="font-black">{freeLeft}</p>
        </div>
        <div>
          <p className="text-emerald-300/70 text-xs uppercase font-bold">{t("Prochains transferts")}</p>
          <p className="font-black">−{deduction} pts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* My squad — sell side */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <h3 className="font-black text-gray-900 mb-3">{t("Mon effectif")}</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {squad.map(p => (
              <PlayerRow key={p.id} p={p} side="sell" />
            ))}
          </div>
        </div>

        {/* Market — buy side */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="font-black text-gray-900 mr-auto">{t("Marché")}</h3>
            {["", "G", "D", "M", "F"].map(p => (
              <button
                key={p}
                onClick={() => setPosFilter(p)}
                className={`px-3 py-1 rounded-lg text-xs font-black ${
                  posFilter === p
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {p || t("Tous")}
              </button>
            ))}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("Rechercher…")}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {players
              .filter(p => !squad.some(q => q.id === p.id))
              .slice(0, 60)
              .map(p => (
                <PlayerRow key={p.id} p={p} side="buy" />
              ))}
          </div>
        </div>
      </div>

      {/* Confirmation bar */}
      {(sellPick || buyPick) && (
        <div className="rounded-2xl bg-white border-2 border-emerald-500 p-4 flex flex-wrap items-center gap-4">
          <LuArrowLeftRight className="text-emerald-600 text-2xl" />
          <div className="flex-1 min-w-[200px] text-sm">
            <p className="font-bold text-gray-900">
              {sellPick?.name ?? "?"} → {buyPick?.name ?? "?"}
            </p>
            <p className="text-gray-500">
              {t("Budget après transfert")}:{" "}
              <strong className={costDelta > Number(team.budget) ? "text-red-600" : "text-emerald-600"}>
                £{(Number(team.budget) - costDelta).toFixed(1)}m
              </strong>
              {deduction > 0 && (
                <span className="text-red-500 ml-2">
                  (−{deduction} pts)
                </span>
              )}
            </p>
          </div>
          <Button
            name={transfer.isPending ? t("Transfert…") : t("Confirmer")}
            type="primary"
            onClick={confirmTransfer}
            disabled={!sellPick || !buyPick}
          />
          <button
            onClick={() => { setSellPick(null); setBuyPick(null); }}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Transfers;
