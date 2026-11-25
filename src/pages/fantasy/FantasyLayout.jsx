import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../../ui/Container";
import { LuTrophy } from "react-icons/lu";

const TABS = [
  { to: "/fantasy", end: true, key: "Accueil" },
  { to: "/fantasy/equipe", key: "Mon Équipe" },
  { to: "/fantasy/transferts", key: "Transferts" },
  { to: "/fantasy/joueurs", key: "Joueurs" },
  { to: "/fantasy/ligues", key: "Ligues" },
  { to: "/fantasy/fixtures", key: "Fixtures" },
  { to: "/fantasy/stats", key: "Stats" },
  { to: "/fantasy/hall-of-fame", key: "Hall of Fame" },
  { to: "/fantasy/regles", key: "Règles" },
];

const FantasyLayout = () => {
  const { t } = useTranslation();
  return (
    <Container>
      <div className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <LuTrophy className="text-xl" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{t("Fantasy")}</h1>
            <p className="text-gray-500 text-sm">
              {t("Football Autopsie Fantasy — construisez votre équipe dream")}
            </p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          {TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-emerald-500 text-white"
                    : "bg-white/5 text-gray-400 hover:text-gray-100 hover:bg-white/10 border border-white/10"
                }`
              }
            >
              {t(tab.key)}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </Container>
  );
};

export default FantasyLayout;
