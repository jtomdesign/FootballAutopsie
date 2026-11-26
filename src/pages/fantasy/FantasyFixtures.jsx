import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFantasySeason, useActiveGameweek } from "../../hooks/fantasy";
import { Link } from "react-router-dom";

// Upcoming fixtures for the active fantasy competition, grouped by gameweek.
const FantasyFixtures = () => {
  const { t } = useTranslation();
  const { season, isLoading } = useFantasySeason();
  const { data: gw } = useActiveGameweek(season?.id);

  // Fixtures live in the site API, not Supabase — reuse the public proxy.
  const [fixtures, setFixtures] = React.useState([]);
  React.useEffect(() => {
    if (!season?.comp?.api_league_id || !season?.api_season) return;
    fetch(
      `/api/football?path=/fixtures&league=${season.comp.api_league_id}&season=${season.api_season}&next=20`,
    )
      .then(r => r.json())
      .then(j => setFixtures(j?.response ?? []))
      .catch(() => setFixtures([]));
  }, [season]);

  if (isLoading) return <p className="text-gray-500 py-10 text-center">{t("Chargement…")}</p>;
  if (!season) return <p className="text-gray-500 py-10 text-center">{t("Aucune saison active.")}</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-gray-100 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
          {season.comp?.name} · {season.name}
        </p>
        <h2 className="text-xl font-bold mt-1">
          {gw ? `${t("Gameweek")} ${gw.number}` : t("Prochains matchs")}
        </h2>
        {gw?.deadline && (
          <p className="text-gray-400 text-sm mt-1">
            {t("Deadline")} : {new Date(gw.deadline).toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-emerald-950/60 border border-emerald-900/60 overflow-hidden">
        {!fixtures.length ? (
          <p className="p-8 text-center text-gray-400 text-sm">{t("Aucun match à venir.")}</p>
        ) : (
          <div className="divide-y divide-white/5">
            {fixtures.map(f => (
              <Link key={f.fixture.id} to={`/match/${f.fixture.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/5">
                <div className="flex items-center gap-3 flex-1">
                  <img src={f.teams.home.logo} alt="" className="w-6 h-6 object-contain" />
                  <span className="font-semibold text-gray-100 text-sm">{f.teams.home.name}</span>
                </div>
                <div className="text-center px-4">
                  {f.fixture.status.short === "NS" || f.fixture.status.short === "TBD" ? (
                    <span className="text-xs font-bold text-gray-400">
                      {new Date(f.fixture.date).toLocaleString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  ) : (
                    <span className="font-bold text-sm">
                      {f.goals.home ?? 0} - {f.goals.away ?? 0}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="font-semibold text-gray-100 text-sm">{f.teams.away.name}</span>
                  <img src={f.teams.away.logo} alt="" className="w-6 h-6 object-contain" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FantasyFixtures;
