import React from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { adminListUsers } from "../../services/user";
import { formatDate, formatDateTime } from "../../utils/helpers";
import { CardGridSkeleton } from "../../components/football/Skeleton";
import EmptyState from "../../components/football/EmptyState";
import { RiTeamLine, RiMailLine, RiCalendarLine, RiLoginCircleLine } from "react-icons/ri";

const ROLE_STYLES = {
  admin: "bg-emerald-500/15 text-emerald-600",
  editor: "bg-blue-500/15 text-blue-600",
  user: "bg-gray-500/15 text-gray-500",
};
const ROLE_LABELS = { admin: "Admin", editor: "Éditeur", user: "Utilisateur" };

const Users = () => {
  const { user } = useSelector(s => s.user);
  const isAdmin = user?.role === "admin";
  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminListUsers,
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  if (!isAdmin)
    return (
      <EmptyState
        title="Accès refusé"
        message="Seuls les administrateurs peuvent voir la liste des utilisateurs."
      />
    );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-100 flex items-center gap-2">
          <RiTeamLine className="text-emerald-400" /> Utilisateurs
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {users.length} compte{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : isError ? (
        <EmptyState
          title="Erreur de chargement"
          message={error?.message ?? "Impossible de charger les utilisateurs."}
        />
      ) : users.length ? (
        <div className="bg-emerald-950/60 rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 border-b border-emerald-900/60">
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">Inscrit le</th>
                <th className="px-5 py-3">Dernière connexion</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const name = u.full_name || u.username || "Utilisateur";
                const initials = name
                  .split(" ")
                  .map(w => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <tr
                    key={u.id}
                    className="border-b border-emerald-900/60 last:border-0 hover:bg-emerald-900/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover bg-emerald-900/60 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-100 truncate">{name}</p>
                          {u.username && (
                            <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <RiMailLine className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[14rem]">{u.email}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase ${ROLE_STYLES[u.role] ?? ROLE_STYLES.user}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs whitespace-nowrap">
                        <RiCalendarLine /> {u.created_at ? formatDate(u.created_at) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs whitespace-nowrap">
                        <RiLoginCircleLine /> {u.last_sign_in_at ? formatDateTime(u.last_sign_in_at) : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Aucun utilisateur" message="Aucun compte ne correspond." />
      )}
    </div>
  );
};

export default Users;
