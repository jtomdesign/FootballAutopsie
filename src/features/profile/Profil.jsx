import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../authentication/authSlice";
import { signOut } from "../../services/auth";
import Button from "../../ui/Button";
import { formatDate } from "../../utils/helpers";

const ROLE_LABELS = { admin: "Administrateur", editor: "Éditeur", user: "Utilisateur" };

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-emerald-900/60 last:border-0">
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-100 truncate ml-4">{value ?? "—"}</span>
  </div>
);

const Profil = () => {
  const { user } = useSelector(state => state.user);
  const dispatch = useDispatch();

  const displayName = user?.name || user?.username || user?.email || "Utilisateur";
  const initials = displayName
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-100">Mon profil</h1>
        <p className="text-sm text-gray-400 mt-1">Vos informations de compte.</p>
      </div>
      <div className="bg-emerald-950/60 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-16 h-16 rounded-full object-cover bg-emerald-900/60"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xl font-bold">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-gray-100 truncate">
              {displayName}
            </h2>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[0.65rem] font-bold uppercase">
              {ROLE_LABELS[user?.role] ?? user?.role}
            </span>
          </div>
        </div>
        <InfoRow label="Nom" value={user?.name} />
        <InfoRow label="Nom d'utilisateur" value={user?.username ? `@${user.username}` : null} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Membre depuis" value={user?.createdAt ? formatDate(user.createdAt) : null} />
        <div className="pt-5">
          <Button
            type="danger"
            name="Se déconnecter"
            onClick={() => {
              dispatch(logout());
              signOut();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Profil;
