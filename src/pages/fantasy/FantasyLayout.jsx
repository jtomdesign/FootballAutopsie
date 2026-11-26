import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../../ui/Container";
import { LuTrophy } from "react-icons/lu";
import { useFantasyRealtime } from "../../hooks/fantasy";

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
  useFantasyRealtime();
  return (
    <Container>
      <div className="py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <LuTrophy className="text-3xl text-emerald-400" />
          <h1 className="text-2xl font-bold text-gray-100">{t("Fantasy")}</h1>
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
                    : "bg-white/5 text-gray-400 hover:text-gray-100 hover:bg-white/10"
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
