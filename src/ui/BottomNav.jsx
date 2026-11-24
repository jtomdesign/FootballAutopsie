import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  RiHome6Line,
  RiNewspaperLine,
  RiRadioLine,
  RiSearchLine,
  RiUserLine,
} from "react-icons/ri";

const ITEMS = [
  { to: "/", label: "Accueil", icon: RiHome6Line, end: true },
  { to: "/news", label: "News", icon: RiNewspaperLine },
  { to: "/scores", label: "Direct", icon: RiRadioLine },
  { to: "/recherche", label: "Recherche", icon: RiSearchLine },
];

const BottomNav = () => {
  const { isAuthenticated } = useSelector(s => s.user);
  const items = [
    ...ITEMS,
    {
      to: isAuthenticated ? "/mon-espace" : "/compte",
      label: isAuthenticated ? "Espace" : "Compte",
      icon: RiUserLine,
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
              `fa-bottomnav-item flex-1 flex flex-col items-center gap-0.5 py-2 text-[0.65rem] font-semibold transition-colors ${
                isActive ? "is-active" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`p-1 rounded-full transition-colors ${
                    isActive ? "fa-bottomnav-active-bg" : ""
                  }`}
                >
                  <Icon className="text-xl" />
                </span>
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
