import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { RiEyeFill } from "react-icons/ri";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authentication/authSlice";
import { signOut } from "../services/auth";
import Sidebar from "../ui/Sidebar";
import HamburgerIcon from "../ui/HamburgerIcon";
import { useSEO } from "../utils/seo";

const MOBILE_LINKS = [
  { to: "/dashboard", label: "Vue d'ensemble", end: true },
  { to: "/dashboard/posts", label: "Articles" },
  { to: "/dashboard/categories", label: "Catégories" },
  { to: "/dashboard/comments", label: "Commentaires" },
  { to: "/dashboard/messages", label: "Messages" },
  { to: "/dashboard/users", label: "Utilisateurs" },
  { to: "/dashboard/profil", label: "Profil" },
  { to: "/dashboard/settings", label: "Paramètres" },
];

const ROLE_LABELS = { admin: "Administrateur", editor: "Éditeur", user: "Utilisateur" };

const Dashboard = () => {
  useSEO({ title: "Tableau de bord", path: "/dashboard", noindex: true });
  const { user } = useSelector(store => store.user);
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.name || user?.email || "Utilisateur";
  const initials = displayName
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    dispatch(logout());
    signOut();
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Sidebar />

      <div className="flex flex-col min-w-0">
        <header className="fa-dark-surface bg-emerald-950 m-3 mb-0 rounded-2xl sticky top-3 z-40">
          <div className="min-h-20 px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-2 -ml-2 text-emerald-100/80 hover:text-white cursor-pointer"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Menu"
              >
                <HamburgerIcon open={menuOpen} className="text-emerald-100/80" />
              </button>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover bg-emerald-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base lg:text-lg font-bold text-emerald-50 truncate">
                  {displayName}
                </h1>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[0.6rem] font-bold uppercase tracking-wide">
                  {ROLE_LABELS[user?.role] ?? user?.role}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/15 text-emerald-50 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <RiEyeFill className="sm:hidden" />
                <span className="hidden sm:inline">Voir le site</span>
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full text-sm font-semibold text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
              >
                Quitter
              </button>
            </div>
          </div>

        </header>

        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60 fa-menu-drop"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="fa-dark-surface absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-emerald-950 shadow-2xl flex flex-col fa-drawer-in">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
                <span className="text-emerald-50 font-bold text-sm uppercase tracking-wide">
                  Navigation
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 text-emerald-100/70 hover:text-white cursor-pointer"
                  aria-label="Fermer"
                >
                  <HamburgerIcon open className="text-emerald-100/70" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
                {MOBILE_LINKS.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-emerald-50 text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-white/10">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-emerald-50 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <RiEyeFill /> Voir le site
                </a>
              </div>
            </nav>
          </div>
        )}

        <main className="flex-1 p-3 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
