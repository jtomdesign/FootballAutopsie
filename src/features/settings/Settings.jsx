import React from "react";
import { Link } from "react-router-dom";
import {
  RiBookOpenFill,
  RiStackFill,
  RiChat4Fill,
  RiInboxLine,
  RiTeamLine,
} from "react-icons/ri";

const ITEMS = [
  {
    to: "/dashboard/posts",
    icon: <RiBookOpenFill />,
    title: "Articles",
    desc: "Créer, modifier et publier les articles.",
  },
  {
    to: "/dashboard/categories",
    icon: <RiStackFill />,
    title: "Catégories",
    desc: "Gérer les catégories et leurs couleurs.",
  },
  {
    to: "/dashboard/comments",
    icon: <RiChat4Fill />,
    title: "Commentaires",
    desc: "Modération des commentaires des lecteurs.",
  },
  {
    to: "/dashboard/messages",
    icon: <RiInboxLine />,
    title: "Messages",
    desc: "Messages reçus via le formulaire de contact.",
  },
  {
    to: "/dashboard/users",
    icon: <RiTeamLine />,
    title: "Utilisateurs",
    desc: "Liste des comptes enregistrés (admin).",
  },
];

const Settings = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-100">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-1">
          Accès rapide aux sections de gestion.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-emerald-950/60 rounded-2xl p-5 hover:bg-emerald-900/50 transition-colors flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl text-emerald-400 shrink-0">
              {item.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-100">{item.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Settings;
