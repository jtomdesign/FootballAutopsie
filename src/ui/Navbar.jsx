import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Logo from "./Logo";
import { Container } from "./Container";
import {
  RiUser3Fill,
  RiUser3Line,
  RiSearchLine,
  RiSunLine,
  RiMoonLine,
} from "react-icons/ri";
import { useTheme } from "../theme/context";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authentication/authSlice";
import { signOut } from "../services/auth";
import NotificationBell from "../components/user/NotificationBell";
import HamburgerIcon from "./HamburgerIcon";

const NAV_LINKS = [
  { to: "/", key: "Accueil" },
  { to: "/news", key: "News" },
  { to: "/matchs", key: "Matchs" },
  { to: "/scores", key: "En direct" },
  { to: "/ligues", key: "Compétitions" },
  { to: "/equipes", key: "Équipes" },
  { to: "/joueurs", key: "Joueurs" },
  { to: "/contact", key: "Contact" },
];

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isLight, toggle: toggleTheme } = useTheme();
  const { user, isAuthenticated } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language?.startsWith("en") ? "fr" : "en";
    i18n.changeLanguage(next);
  };

  return (
    <div className="site-navbar bg-white border-b border-gray-100 sticky top-0 w-full z-50">
      <Container>
        <div className="flex h-20 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="w-32 sm:w-45 shrink-0">
              <Logo surface="light" className="w-full p-2" />
            </Link>
            <nav className="hidden xl:flex text-emerald-950 uppercase font-bold font-menu gap-6 text-[1.05rem]">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-full text-emerald-950 hover:bg-emerald-100 transition-colors cursor-pointer"
              aria-label={isLight ? t("Mode sombre") : t("Mode clair")}
              title={isLight ? t("Mode sombre") : t("Mode clair")}
            >
              {isLight ? <RiMoonLine className="text-xl" /> : <RiSunLine className="text-xl" />}
            </button>

            <button
              onClick={toggleLang}
              className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-950 border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
              aria-label="Language"
              title={i18n.language?.startsWith("en") ? "Français" : "English"}
            >
              {i18n.language?.startsWith("en") ? "EN" : "FR"}
            </button>

            <button
              onClick={() => navigate("/recherche")}
              className="p-2 sm:p-2.5 rounded-full text-emerald-950 hover:bg-emerald-100 transition-colors cursor-pointer"
              aria-label={t("Rechercher")}
            >
              <RiSearchLine className="text-xl" />
            </button>

            {isAuthenticated && <NotificationBell />}

            {!isAuthenticated ? (
              <div className="hidden xl:block">
                <Button
                  name={t("Se Connecter")}
                  onClick={() => navigate("/compte")}
                  type="simple"
                  icon={<RiUser3Line />}
                />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <p className="font-semibold text-emerald-950 text-sm">
                  {t("Bonjour, {{name}}", { name: user?.name })}
                </p>
                <Button
                  name={t("Mon espace")}
                  onClick={() => navigate("/mon-espace")}
                  type="simple"
                />
                {(user?.role === "admin" || user?.role === "editor") && (
                  <Button
                    name={t("Dashboard")}
                    onClick={() => navigate("/dashboard")}
                    type="simple"
                  />
                )}
                <Button
                  name={t("Se Deconnecter")}
                  onClick={() => {
                    dispatch(logout());
                    signOut();
                  }}
                  type="simple"
                  icon={<RiUser3Line />}
                />
              </div>
            )}

            <button
              className="xl:hidden p-1.5 sm:p-2 text-emerald-950 cursor-pointer"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={t("Menu")}
            >
              <HamburgerIcon open={menuOpen} className="text-emerald-950" />
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="xl:hidden border-t border-gray-100 bg-white fa-menu-drop">
          <Container>
            <nav className="flex flex-col py-3">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-2 text-emerald-950 uppercase font-bold font-menu text-lg border-b border-gray-100 last:border-0 hover:text-emerald-500"
                >
                  {t(link.key)}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/compte"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-2 text-emerald-950 uppercase font-bold font-menu text-lg border-b border-gray-100 hover:text-emerald-500 flex items-center gap-2"
                >
                  <RiUser3Line className="text-xl" />
                  {t("Se Connecter")}
                </Link>
              )}
              {isAuthenticated && (
                <>
                  <Link
                    to="/mon-espace"
                    onClick={() => setMenuOpen(false)}
                    className="py-3 px-2 text-emerald-950 uppercase font-bold font-menu text-lg border-b border-gray-100 hover:text-emerald-500"
                  >
                    {t("Mon espace")}
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setMenuOpen(false)}
                    className="py-3 px-2 text-emerald-950 uppercase font-bold font-menu text-lg border-b border-gray-100 hover:text-emerald-500"
                  >
                    {t("Notifications")}
                  </Link>
                </>
              )}
              {isAuthenticated && (user?.role === "admin" || user?.role === "editor") && (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-2 text-emerald-950 uppercase font-bold font-menu text-lg border-b border-gray-100 hover:text-emerald-500"
                >
                  {t("Tableau de bord")}
                </Link>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    dispatch(logout());
                    signOut();
                  }}
                  className="py-3 px-2 text-left text-red-600 uppercase font-bold font-menu text-lg cursor-pointer"
                >
                  {t("Déconnexion")}
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="py-3 px-2 text-left text-emerald-950 uppercase font-bold font-menu text-lg border-t border-gray-100 cursor-pointer flex items-center gap-2"
              >
                {isLight ? <RiMoonLine className="text-xl" /> : <RiSunLine className="text-xl" />}
                {isLight ? t("Mode sombre") : t("Mode clair")}
              </button>
              <button
                onClick={toggleLang}
                className="py-3 px-2 text-left text-emerald-950 uppercase font-bold font-menu text-lg border-t border-gray-100 cursor-pointer"
              >
                {i18n.language?.startsWith("en") ? "Français" : "English"}
              </button>
            </nav>
          </Container>
        </div>
      )}
    </div>
  );
};

export default Navbar;
