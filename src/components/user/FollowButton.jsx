import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  RiUserFollowLine,
  RiUserUnfollowLine,
  RiBookmarkLine,
  RiBookmarkFill,
} from "react-icons/ri";
import { useFavorites, useToggleFavorite } from "../../hooks/user";

/**
 * Follow/unfollow button for teams, players, competitions and matches.
 * Guests are prompted to log in.
 */
const FollowButton = ({
  entityType, // team | player | competition | match
  entityId,
  entityName,
  entityLogo,
  className = "",
  small = false,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector(s => s.user);
  const navigate = useNavigate();
  const { data: favorites = [] } = useFavorites();
  const toggle = useToggleFavorite();

  const active = favorites.some(
    f => f.entity_type === entityType && f.entity_id === String(entityId),
  );

  const onClick = () => {
    if (!isAuthenticated) {
      toast(t("Connectez-vous pour suivre cet élément"), { icon: "🔒" });
      navigate("/compte");
      return;
    }
    toggle.mutate({ entityType, entityId, entityName, entityLogo });
  };

  const Icon = active ? RiUserUnfollowLine : RiUserFollowLine;
  const MatchIcon = active ? RiBookmarkFill : RiBookmarkLine;
  const UseIcon = entityType === "match" ? MatchIcon : Icon;

  return (
    <button
      onClick={onClick}
      disabled={toggle.isPending}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${
        active
          ? "bg-emerald-700 text-white hover:bg-emerald-800"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      } ${className}`}
    >
      <UseIcon />
      {active
        ? entityType === "match"
          ? t("Match suivi")
          : t("Suivi")
        : entityType === "match"
          ? t("Suivre le match")
          : t("Suivre")}
    </button>
  );
};

export default FollowButton;
