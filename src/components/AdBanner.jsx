import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const ADSENSE_CLIENT = "ca-pub-1470302561075524";

// Ad unit slot IDs from AdSense → Ads → By ad unit.
// Set them in .env as VITE_ADSENSE_SLOT_LEADERBOARD / VITE_ADSENSE_SLOT_RECTANGLE.
// While unset, the placeholder is shown instead of a broken ad unit.
const SLOTS = {
  leaderboard: import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD || "",
  rectangle: import.meta.env.VITE_ADSENSE_SLOT_RECTANGLE || "",
};

/**
 * Advertisement slot.
 * variant: "leaderboard" (wide, ~728x90) | "rectangle" (sidebar, ~300x250)
 * Renders a real AdSense unit when its slot ID is configured,
 * otherwise a themed placeholder.
 */
const AdBanner = ({ variant = "leaderboard", className = "" }) => {
  const { t } = useTranslation();
  const isRect = variant === "rectangle";
  const slot = SLOTS[variant];

  useEffect(() => {
    if (!slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense already pushed for this slot */
    }
  }, [slot]);

  if (!slot) {
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
  }

  return (
    <div
      className={`flex justify-center overflow-hidden rounded-xl bg-emerald-500/5 ${className}`}
      style={isRect ? { minHeight: "15rem" } : { minHeight: "6.5rem" }}
      aria-label={t("Espace publicitaire")}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
