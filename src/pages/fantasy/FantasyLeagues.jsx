import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useFantasySeason,
  useFantasyLeagues,
  useMyTeam,
  useCreateLeague,
  useJoinLeague,
} from "../../hooks/fantasy";
import Button from "../../ui/Button";
import { LuLock, LuGlobe, LuCopy, LuPlus } from "react-icons/lu";

const TYPE_META = {
  public_global: { icon: LuGlobe, label: "Globale", cls: "bg-emerald-500/15 text-emerald-300" },
  public_country: { icon: LuGlobe, label: "Pays", cls: "bg-sky-100 text-sky-700" },
  private: { icon: LuLock, label: "Privée", cls: "bg-amber-100 text-amber-700" },
  h2h: { icon: LuGlobe, label: "Head-to-head", cls: "bg-rose-100 text-rose-700" },
};

const FantasyLeagues = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector(s => s.user);
  const { season } = useFantasySeason();
  const { data: leagues, isLoading } = useFantasyLeagues(season?.id);
  const { data: myTeam } = useMyTeam(season?.id);
  const createLeague = useCreateLeague();
  const joinLeague = useJoinLeague();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "private", maxMembers: "" });
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const grouped = useMemo(() => {
    const g = { public_global: [], public_country: [], private: [], h2h: [] };
    (leagues ?? []).forEach(l => (g[l.type] ?? g.private).push(l));
    return g;
  }, [leagues]);

  const doCreate = async () => {
    try {
      await createLeague.mutateAsync({
        seasonId: season.id,
        name: form.name,
        description: form.description || null,
        type: form.type,
        maxMembers: form.maxMembers ? Number(form.maxMembers) : null,
      });
      toast.success(t("Ligues créée"));
      setShowCreate(false);
      setForm({ name: "", description: "", type: "private", maxMembers: "" });
    } catch (e) {
      toast.error(e.message);
    }
  };

  const doJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await joinLeague.mutateAsync(joinCode.trim());
      toast.success(t("Bienvenue dans la ligue !"));
      setJoinCode("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  const LeagueCard = ({ league }) => {
    const meta = TYPE_META[league.type] ?? TYPE_META.private;
    const Icon = meta.icon;
    const members = league.fantasy_league_members?.[0]?.count ?? 0;
    return (
      <Link
        to={`/fantasy/ligues/${league.id}`}
        className="block rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-4 hover:border-emerald-400 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-100">{league.name}</p>
            {league.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{league.description}</p>
            )}
          </div>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.cls}`}>
            <Icon className="w-3 h-3" /> {t(meta.label)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{members} {t("membres")}</span>
          {league.type.startsWith("public") && myTeam ? (
            <button
              onClick={async e => {
                e.preventDefault();
                try {
                  await joinLeague.mutateAsync(String(league.id));
                  toast.success(t("Rejoint !"));
                } catch (err) {
                  toast.error(err.message);
                }
              }}
              className="font-bold text-emerald-400 hover:underline"
            >
              {t("Rejoindre")}
            </button>
          ) : league.invite_code ? (
            <button
              onClick={e => {
                e.preventDefault();
                navigator.clipboard?.writeText(league.invite_code);
                toast.success(t("Code copié"));
              }}
              className="flex items-center gap-1 font-bold text-emerald-400 hover:underline"
            >
              <LuCopy className="w-3 h-3" /> {league.invite_code}
            </button>
          ) : null}
        </div>
      </Link>
    );
  };

  const Section = ({ title, items }) =>
    items?.length ? (
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">{title}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(l => <LeagueCard key={l.id} league={l} />)}
        </div>
      </div>
    ) : null;

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-10 text-center">
        <p className="text-gray-400">{t("Connectez-vous pour voir les ligues.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Join by code */}
      <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-4 flex flex-wrap items-center gap-3">
        <input
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase())}
          placeholder={t("Code d'invitation ou ID de ligue")}
          className="rounded-lg fa-input px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <Button name={joining ? "…" : t("Rejoindre")} type="primary"
          onClick={doJoin} disabled={joining || !joinCode.trim()} />
      </div>

      {/* Create */}
      {myTeam && (
        <div>
          {!showCreate ? (
            <Button name={t("Créer une ligue")} type="secondary" icon={<LuPlus />}
              onClick={() => setShowCreate(true)} />
          ) : (
            <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 p-5 space-y-3">
              <h3 className="font-bold text-gray-100">{t("Nouvelle ligue")}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="rounded-lg fa-input px-3 py-2 text-sm"
                  placeholder={t("Nom de la ligue")}
                  value={form.name}
                  onChange={e => setForm(v => ({ ...v, name: e.target.value }))} />
                <input className="rounded-lg fa-input px-3 py-2 text-sm"
                  placeholder={t("Description (optionnel)")}
                  value={form.description}
                  onChange={e => setForm(v => ({ ...v, description: e.target.value }))} />
                <select className="rounded-lg fa-input px-3 py-2 text-sm"
                  value={form.type}
                  onChange={e => setForm(v => ({ ...v, type: e.target.value }))}>
                  <option value="private">{t("Privée (code d'invitation)")}</option>
                  <option value="h2h">{t("Head-to-head")}</option>
                </select>
                <input className="rounded-lg fa-input px-3 py-2 text-sm"
                  placeholder={t("Max membres (optionnel)")}
                  type="number"
                  value={form.maxMembers}
                  onChange={e => setForm(v => ({ ...v, maxMembers: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button name={t("Créer")} type="primary" onClick={doCreate}
                  disabled={!form.name.trim() || createLeague.isPending} />
                <Button name={t("Annuler")} type="secondary"
                  onClick={() => setShowCreate(false)} />
              </div>
            </div>
          )}
        </div>
      )}
      {!myTeam && (
        <p className="text-sm text-gray-500">
          {t("Créez votre équipe pour pouvoir créer ou rejoindre des ligues.")}{" "}
          <Link to="/fantasy/equipe" className="text-emerald-400 font-bold">
            {t("Mon équipe")}
          </Link>
        </p>
      )}

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">{t("Chargement…")}</p>
      ) : (
        <>
          <Section title={t("Ligues publiques")} items={[...grouped.public_global, ...grouped.public_country]} />
          <Section title={t("Head-to-head")} items={grouped.h2h} />
          <Section title={t("Ligues privées")} items={grouped.private} />
          {!leagues?.length && (
            <p className="text-center text-gray-400 py-8">
              {t("Aucune ligue pour cette saison.")}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default FantasyLeagues;
