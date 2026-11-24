import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import {
  LuGoal,
  LuArrowLeft,
} from "react-icons/lu";
import { useSEO } from "../utils/seo";

const NotFound = () => {
  const { t } = useTranslation();
  useSEO({ title: "Page introuvable", noindex: true });
  return (
    <Container>
      <div className="flex flex-col items-center justify-center py-28 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-3xl mb-6">
          <LuGoal />
        </div>
        <p className="font-menu text-7xl sm:text-8xl text-emerald-500 leading-none mb-2">
          404
        </p>
        <h1 className="text-2xl font-extrabold text-gray-100 mb-2">
          {t("Page introuvable")}
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-8">
          {t("La page que vous cherchez n'existe pas ou a été déplacée.")}
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
          >
            {t("Retour à l'accueil")}
          </Link>
          <Link
            to="/news"
            className="px-6 py-3 rounded-full border border-emerald-500/40 text-emerald-600 text-sm font-bold hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5"
          >
            <LuArrowLeft /> {t("Actualités")}
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default NotFound;
