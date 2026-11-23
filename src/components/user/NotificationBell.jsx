import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RiNotification3Line } from "react-icons/ri";
import {
  useNotifications,
  useUnreadNotifications,
  useMarkNotificationRead,
  useSyncNotifications,
} from "../../hooks/user";
import { formatDateTime } from "../../utils/helpers";
import { useTheme } from "../../theme/context";

const NotificationBell = () => {
  const { t } = useTranslation();
  const { isLight } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useSyncNotifications();
  const { data: unread = 0 } = useUnreadNotifications();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();

  React.useEffect(() => {
    const close = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const recent = notifications.slice(0, 6);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 sm:p-2.5 rounded-full text-emerald-950 hover:bg-emerald-100 transition-colors cursor-pointer"
        aria-label={t("Notifications")}
      >
        <RiNotification3Line className="text-xl" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[0.6rem] font-black flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl overflow-hidden z-50 ${
          isLight ? "bg-white border border-gray-100" : "bg-[#1f1f1f] border border-[#333]"
        }`}>
          <div className={`px-4 py-3 flex items-center justify-between ${
            isLight ? "border-b border-gray-100" : "border-b border-[#333]"
          }`}>
            <span className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{t("Notifications")}</span>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              {t("Tout voir")}
            </Link>
          </div>
          {recent.length ? (
            <ul className="max-h-96 overflow-y-auto">
              {recent.map(n => (
                <li key={n.id}>
                  <Link
                    to={n.target_url ?? "/notifications"}
                    onClick={() => {
                      setOpen(false);
                      if (!n.is_read) markRead.mutate(n.id);
                    }}
                    className={`block px-4 py-3 transition-colors ${
                      isLight ? "hover:bg-[#f5f5f5]" : "hover:bg-[#2a2a2a]"
                    } ${n.is_read ? "opacity-60" : ""}`}
                  >
                    <p className={`text-xs font-bold truncate ${isLight ? "text-gray-900" : "text-white"}`}>{n.title}</p>
                    {n.message && (
                      <p className={`text-xs truncate mt-0.5 ${isLight ? "text-gray-500" : "text-gray-400"}`}>{n.message}</p>
                    )}
                    <p className={`text-[0.6rem] mt-1 ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                      {formatDateTime(n.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`px-4 py-6 text-sm text-center ${isLight ? "text-gray-400" : "text-gray-500"}`}>
              {t("Aucune notification")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
