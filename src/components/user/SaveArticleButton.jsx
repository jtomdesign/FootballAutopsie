import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  LuBookmark,
} from "react-icons/lu";
import { useSavedArticles, useToggleSavedArticle } from "../../hooks/user";

const SaveArticleButton = ({ postId }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector(s => s.user);
  const navigate = useNavigate();
  const { data: saved = [] } = useSavedArticles();
  const toggle = useToggleSavedArticle();

  const active = saved.some(s => s.post_id === postId);

  const onClick = () => {
    if (!isAuthenticated) {
      toast(t("Connectez-vous pour enregistrer cet article"), { icon: "🔒" });
      navigate("/compte");
      return;
    }
    toggle.mutate(postId);
  };

  return (
    <button
      onClick={onClick}
      disabled={toggle.isPending}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
        active
          ? "bg-emerald-700 text-white"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {active ? <LuBookmark /> : <LuBookmark />}
      {active ? t("Enregistré") : t("Enregistrer")}
    </button>
  );
};

export const ShareButtons = ({ title }) => {
  const { t } = useTranslation();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("Lien copié"));
    } catch {
      toast.error(t("Impossible de copier le lien"));
    }
  };
  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
    >
      {t("Partager")}
    </button>
  );
};

export default SaveArticleButton;
