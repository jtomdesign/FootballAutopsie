import React from "react";
import { useTranslation } from "react-i18next";
import { useScoringRules } from "../../hooks/fantasy";
import { LuBookOpen, LuScale } from "react-icons/lu";

const FantasyRules = () => {
  const { t } = useTranslation();
  const { data: rules } = useScoringRules();

  const goalByPos = rules?.goal ?? {};
  const csByPos = rules?.clean_sheet ?? {};

  const Row = ({ event, G, D, M, F }) => (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="px-4 py-2.5 font-semibold text-gray-800">{event}</td>
      {[G, D, M, F].map((v, i) => (
        <td key={i} className="px-4 py-2.5 text-center font-black text-gray-900">{v}</td>
      ))}
    </tr>
  );

  const Section = ({ title, children }) => (
    <div className="rounded-2xl bg-white border border-gray-200 p-5">
      <h3 className="font-black text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="rounded-2xl bg-emerald-950 text-white p-6">
        <h2 className="text-xl font-black flex items-center gap-2">
          <LuBookOpen className="text-emerald-400" /> {t("Règles & Barème")}
        </h2>
        <p className="text-emerald-200/70 text-sm mt-2">
          {t("Tout ce qu'il faut savoir pour dominer la saison fantasy.")}
        </p>
      </div>

      <Section title={t("Composition d'équipe")}>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-5">
          <li>{t("Budget de départ : £100 millions")}</li>
          <li>{t("15 joueurs : 2 Gardiens, 5 Défenseurs, 5 Milieux, 3 Attaquants")}</li>
          <li>{t("Maximum 3 joueurs par club")}</li>
          <li>{t("11 titulaires + 4 remplaçants, formations 3-4-3 à 5-4-1")}</li>
          <li>{t("Capitaine ×2 points, vice-capitaine prend le relais s'il ne joue pas")}</li>
        </ul>
      </Section>

      <Section title={t("Transferts")}>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-5">
          <li>{t("1 transfert gratuit par journée")}</li>
          <li>{t("Transferts supplémentaires : −4 points chacun")}</li>
          <li>{t("Les transferts inutilisés s'accumulent (max 5)")}</li>
          <li>{t("Fenêtre fermée après la deadline de la journée")}</li>
        </ul>
      </Section>

      <Section title={t("Barème des points")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                <th className="px-4 py-2 text-left">{t("Événement")}</th>
                <th className="px-4 py-2">G</th>
                <th className="px-4 py-2">D</th>
                <th className="px-4 py-2">M</th>
                <th className="px-4 py-2">F</th>
              </tr>
            </thead>
            <tbody>
              <Row event={t("Titularisation (<60 min)")} G={rules?.appear_under_60 ?? 1} D={rules?.appear_under_60 ?? 1} M={rules?.appear_under_60 ?? 1} F={rules?.appear_under_60 ?? 1} />
              <Row event={t("Titularisation (60+ min)")} G={rules?.appear_60_plus ?? 2} D={rules?.appear_60_plus ?? 2} M={rules?.appear_60_plus ?? 2} F={rules?.appear_60_plus ?? 2} />
              <Row event={t("But")} G={goalByPos.G ?? 10} D={goalByPos.D ?? 6} M={goalByPos.M ?? 5} F={goalByPos.F ?? 4} />
              <Row event={t("Passe décisive")} G={rules?.assist ?? 3} D={rules?.assist ?? 3} M={rules?.assist ?? 3} F={rules?.assist ?? 3} />
              <Row event={t("Clean sheet")} G={csByPos.G ?? 4} D={csByPos.D ?? 4} M={csByPos.M ?? 1} F={csByPos.F ?? 0} />
              <Row event={t("Penalty arrêtée")} G={rules?.penalty_save ?? 5} D="-" M="-" F="-" />
              <Row event={t("Penalty ratée")} G={rules?.penalty_miss ?? -2} D={rules?.penalty_miss ?? -2} M={rules?.penalty_miss ?? -2} F={rules?.penalty_miss ?? -2} />
              <Row event={t("Carton jaune")} G={rules?.yellow ?? -1} D={rules?.yellow ?? -1} M={rules?.yellow ?? -1} F={rules?.yellow ?? -1} />
              <Row event={t("Carton rouge")} G={rules?.red ?? -3} D={rules?.red ?? -3} M={rules?.red ?? -3} F={rules?.red ?? -3} />
              <Row event={t("Penalty encaissé / but contre son camp")} G={rules?.own_goal ?? -2} D={rules?.own_goal ?? -2} M={rules?.own_goal ?? -2} F={rules?.own_goal ?? -2} />
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <LuScale className="w-3.5 h-3.5" />
          {t("Barème configurable par l'administration — ces valeurs sont lues en direct depuis la base.")}
        </p>
      </Section>

      <Section title={t("Remplacements automatiques")}>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-5">
          <li>{t("Après la deadline, les titulaires n'ayant pas joué sont remplacés par les remplaçants dans l'ordre.")}</li>
          <li>{t("Un gardien remplaçant ne peut remplacer qu'un gardien.")}</li>
          <li>{t("Le vice-capitaine devient capitaine si le capitaine ne joue pas.")}</li>
        </ul>
      </Section>
    </div>
  );
};

export default FantasyRules;
