import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import SectionHeader from "../components/football/SectionHeader";
import EmptyState from "../components/football/EmptyState";
import {
  useNotifications,
  useUnreadNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "../hooks/user";
import { formatDateTime } from "../utils/helpers";
import {
  RiNotification3Line,
  RiDeleteBinLine,
  RiCheckDoubleLine,
} from "react-icons/ri";
import { useSEO } from "../utils/seo";

const Notifications = () => {
  useSEO({ title: "Notifications", path: "/notifications", noindex: true });
  const { t } = useTranslation();
  const typeLabel = {
    match_live: t("Match en direct"),
    match_reminder: t("Rappel de match"),
    comment_reply: t("Réponse"),
    comment_like: t("Like"),
    news: t("Actualité"),
  };
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unread = 0 } = useUnreadNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const del = useDeleteNotification();

  return (
    <Container>
      <div className="py-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            title={t("Notifications")}
            subtitle={unread ? t("{{count}} non lue(s)", { count: unread }) : t("Tout est lu")}
          />
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer"
            >
              <RiCheckDoubleLine /> {t("Tout marquer lu")}
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">{t("Chargement…")}</p>
        ) : notifications.length ? (
          <ul className="flex flex-col gap-2">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`flex items-start gap-3 bg-white rounded-2xl px-4 py-3 ${
                  n.is_read ? "opacity-60" : ""
                }`}
              >
                <RiNotification3Line
                  className={`mt-0.5 text-lg shrink-0 ${n.is_read ? "text-gray-300" : "text-emerald-600"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {typeLabel[n.type] ?? n.type}
                    </span>
                    <span className="text-[0.65rem] text-gray-400">
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{n.title}</p>
                  {n.message && (
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  )}
                  {n.target_url && (
                    <Link
                      to={n.target_url}
                      onClick={() => !n.is_read && markRead.mutate(n.id)}
                      className="text-xs font-semibold text-emerald-700 hover:underline mt-1 inline-block"
                    >
                      {t("Voir")} →
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      className="text-[0.65rem] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {t("Marquer lu")}
                    </button>
                  )}
                  <button
                    onClick={() => del.mutate(n.id)}
                    className="text-gray-300 hover:text-red-500 cursor-pointer"
                    aria-label={t("Supprimer")}
                  >
                    <RiDeleteBinLine />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={t("Aucune notification")}
            message={t("Les notifications liées à vos équipes, matchs et commentaires apparaîtront ici.")}
            icon={<RiNotification3Line />}
          />
        )}
      </div>
    </Container>
  );
};

export default Notifications;
