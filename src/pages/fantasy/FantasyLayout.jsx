import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../../ui/Container";

const TABS = [
  { to: "/fantasy", end: true, key: "Accueil" },
  { to: "/fantasy/equipe", key: "Mon Équipe" },
  { to: "/fantasy/transferts", key: "Transferts" },
  { to: "/fantasy/joueurs", key: "Joueurs" },
  { to: "/fantasy/ligues", key: "Ligues" },
  { to: "/fantasy/points", key: "Points" },
];

const FantasyLayout = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-emerald-950 text-white">
        <Container>
          <div className="py-6">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">
              Football Autopsie
            </p>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              {t("Fantasy")}
            </h1>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-3 -mb-px">
            {TABS.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "text-emerald-200/70 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                {t(tab.key)}
              </NavLink>
            ))}
          </nav>
        </Container>
      </div>
      <Container>
        <div className="py-6">
          <Outlet />
        </div>
      </Container>
    </div>
  );
};

export default FantasyLayout;
