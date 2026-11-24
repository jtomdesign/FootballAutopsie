import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import Logo from "./Logo";
import { useTheme } from "../theme/context";
import {
  SiFacebook,
  SiX,
  SiInstagram,
  SiYoutube,
} from "react-icons/si";

const FOOTER_LINKS = [
  {
    titleKey: "Navigation",
    links: [
      { to: "/", labelKey: "Accueil" },
      { to: "/news", labelKey: "News" },
      { to: "/matchs", labelKey: "Matchs" },
      { to: "/scores", labelKey: "Scores en direct" },
      { to: "/contact", labelKey: "Contact" },
    ],
  },
  {
    titleKey: "Compétitions",
    links: [
      { to: "/ligues", labelKey: "Toutes les compétitions" },
      { to: "/ligues/39", labelKey: "Premier League" },
      { to: "/ligues/140", labelKey: "La Liga" },
      { to: "/ligues/135", labelKey: "Serie A" },
      { to: "/ligues/78", labelKey: "Bundesliga" },
      { to: "/ligues/61", labelKey: "Ligue 1" },
    ],
  },
  {
    titleKey: "Explorer",
    links: [
      { to: "/equipes", labelKey: "Équipes" },
      { to: "/joueurs", labelKey: "Joueurs" },
      { to: "/recherche", labelKey: "Recherche" },
      { to: "/assistant", labelKey: "Assistant IA" },
    ],
  },
];

const YEAR = new Date().getFullYear();

const Footer = () => {
  const { t } = useTranslation();
  const { isLight } = useTheme();
  const surface = isLight ? "bg-white" : "bg-[#0a0a0a]";
  const text = isLight ? "text-black" : "text-gray-200";
  const link = isLight ? "text-black" : "text-white";
  const muted = isLight ? "text-gray-500" : "text-gray-400";
  const socialBg = isLight ? "bg-gray-100" : "bg-[#1f1f1f]";
  return (
    <footer className={`${surface} mt-16 border-t ${isLight ? "border-gray-100" : "border-[#262626]"}`}>
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-14">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block w-44 mb-5">
              <Logo surface="light" />
            </Link>
            <p className={`${text} text-sm leading-relaxed max-w-xs`}>
              {t(
                "Football Autopsie — votre média football : actualités, matchs en direct, classements, équipes et joueurs."
              )}
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                {
                  icon: <SiFacebook />,
                  label: "Facebook",
                  href: "https://www.facebook.com/autopsiefoot",
                },
                {
                  icon: <SiX />,
                  label: "X",
                  href: "https://x.com/footautopsie",
                },
                {
                  icon: <SiInstagram />,
                  label: "Instagram",
                  href: "https://www.instagram.com/football_autopsie/",
                },
                {
                  icon: <SiYoutube />,
                  label: "YouTube",
                  href: "https://www.youtube.com/@footbalautopsie",
                },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`w-10 h-10 rounded-full ${socialBg} flex items-center justify-center ${muted} hover:bg-emerald-500 hover:text-white hover:-translate-y-0.5 transition-all duration-200 text-lg`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map(col => (
            <div key={col.titleKey}>
              <h4 className={`${text} font-black uppercase tracking-widest text-sm mb-4 font-menu`}>
                {t(col.titleKey)}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map(fl => (
                  <li key={fl.to + fl.labelKey}>
                    <Link
                      to={fl.to}
                      className={`${link} text-sm hover:text-emerald-600 transition-colors`}
                    >
                      {t(fl.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className={`${text} text-xs`}>
            {t("© {{year}} Football Autopsie. Tous droits réservés.", { year: YEAR })}
          </p>
          <p className={`flex items-center gap-1.5 ${text} text-xs`}>
            contact@footautopsie.com
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
