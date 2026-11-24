import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuLayoutGrid,
  LuNewspaper,
  LuTv,
  LuSearch,
  LuUser,
} from "react-icons/lu";

const ITEMS = [
  { to: "/", label: "Accueil", icon: LuLayoutGrid, end: true },
  { to: "/news", label: "News", icon: LuNewspaper },
  { to: "/scores", label: "Direct", icon: LuTv },
  { to: "/recherche", label: "Recherche", icon: LuSearch },
];

const BottomNav = () => {
  const { isAuthenticated } = useSelector(s => s.user);
  const items = [
    ...ITEMS,
    {
      to: isAuthenticated ? "/mon-espace" : "/compte",
      label: isAuthenticated ? "Espace" : "Compte",
      icon: LuUser,
    },
  ];

  return (
    <nav className="fa-bottomnav md:hidden">
      <div className="flex">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `fa-bottomnav-item flex-1 flex flex-col items-center gap-1 px-2 py-3 text-[0.65rem] font-semibold transition-colors ${
                isActive ? "is-active" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="text-xl" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
