import React from "react";
import DashLink from "./DashLink";

import {
  LuBookOpen,
  LuMessageSquare,
  LuSettings,
  LuInbox,
  LuBellRing,
  LuLayoutDashboard,
  LuLogOut,
  LuLayers,
  LuUsers,
  LuUser,
  LuTrophy,
} from "react-icons/lu";
import { Link } from "react-router-dom";
import { logout } from "../features/authentication/authSlice";
import { useDispatch } from "react-redux";
import { signOut } from "../services/auth";
import Logo from "./Logo";

const SectionLabel = ({ children }) => (
  <p className="px-4 pt-5 pb-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-emerald-100/40">
    {children}
  </p>
);

const Sidebar = () => {
  const dispatch = useDispatch();
  return (
    <aside className="fa-dark-surface hidden lg:flex bg-emerald-950 lg:sticky lg:top-0 lg:h-dvh flex-col">
      <div className="px-5 pt-6 pb-2">
        <Link to="/" className="block">
          <Logo surface="dark" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <SectionLabel>Gestion</SectionLabel>
        <DashLink to="/dashboard" end>
          <DashLink.Icon>
            <LuLayoutDashboard />
          </DashLink.Icon>
          <DashLink.Name>Vue d'ensemble</DashLink.Name>
        </DashLink>
        <DashLink to="posts">
          <DashLink.Icon>
            <LuBookOpen />
          </DashLink.Icon>
          <DashLink.Name>Articles</DashLink.Name>
        </DashLink>
        <DashLink to="categories">
          <DashLink.Icon>
            <LuLayers />
          </DashLink.Icon>
          <DashLink.Name>Catégories</DashLink.Name>
        </DashLink>
        <DashLink to="comments">
          <DashLink.Icon>
            <LuMessageSquare />
          </DashLink.Icon>
          <DashLink.Name>Commentaires</DashLink.Name>
        </DashLink>
        <DashLink to="messages">
          <DashLink.Icon>
            <LuInbox />
          </DashLink.Icon>
          <DashLink.Name>Messages</DashLink.Name>
        </DashLink>
        <DashLink to="diffusion">
          <DashLink.Icon>
            <LuBellRing />
          </DashLink.Icon>
          <DashLink.Name>Diffusion</DashLink.Name>
        </DashLink>
        <DashLink to="fantasy">
          <DashLink.Icon>
            <LuTrophy />
          </DashLink.Icon>
          <DashLink.Name>Fantasy</DashLink.Name>
        </DashLink>
        <DashLink to="users">
          <DashLink.Icon>
            <LuUsers />
          </DashLink.Icon>
          <DashLink.Name>Utilisateurs</DashLink.Name>
        </DashLink>

        <SectionLabel>Compte</SectionLabel>
        <DashLink to="profil">
          <DashLink.Icon>
            <LuUser />
          </DashLink.Icon>
          <DashLink.Name>Profil</DashLink.Name>
        </DashLink>
        <DashLink to="settings">
          <DashLink.Icon>
            <LuSettings />
          </DashLink.Icon>
          <DashLink.Name>Paramètres</DashLink.Name>
        </DashLink>
        <DashLink
          onClick={() => {
            dispatch(logout());
            signOut();
          }}
        >
          <DashLink.Icon>
            <LuLogOut />
          </DashLink.Icon>
          <DashLink.Name>Déconnexion</DashLink.Name>
        </DashLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
