import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Advertisement placeholder slot.
 * variant: "leaderboard" (wide, ~728x90) | "rectangle" (sidebar, ~300x250)
 * Replace inner content with a real ad network tag when available.
 */
const AdBanner = ({ variant = "leaderboard", className = "" }) => {
  const { t } = useTranslation();
  const isRect = variant === "rectangle";
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 select-none ${className}`}
      style={isRect ? { minHeight: "15rem" } : { minHeight: "6.5rem" }}
      aria-label={t("Espace publicitaire")}
    >
      <div className="text-center px-4">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-gray-500">
          {t("Publicité")}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {isRect ? "300 × 250" : "728 × 90"}
        </p>
      </div>
    </div>
  );
};

export default AdBanner;
