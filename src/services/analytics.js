import { supabase } from "./supabase";

// Paths that never count as public content views.
const SKIP = /^\/(dashboard|compte|mon-espace|notifications|recherche|api|404)/;

let sessionId = null;
const getSessionId = () => {
  if (sessionId) return sessionId;
  try {
    sessionId =
      localStorage.getItem("fa-sid") ||
      crypto.randomUUID();
    localStorage.setItem("fa-sid", sessionId);
  } catch {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
};

/**
 * Log a page view. Fire-and-forget — silently ignores failures
 * (e.g. before the analytics migration is applied).
 */
export const trackPageView = path => {
  if (!path || SKIP.test(path)) return;
  try {
    // Dedupe rapid repeats (React StrictMode, back/forward within seconds)
    const key = `fa-pv-${path}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(key, String(Date.now()));

    supabase
      .from("page_views")
      .insert({
        path,
        referrer: document.referrer || null,
        session_id: getSessionId(),
        user_agent: navigator.userAgent?.slice(0, 300) ?? null,
      })
      .then(() => {});
  } catch {
    /* analytics must never break the app */
  }
};

/** Aggregated stats for the admin dashboard (staff only). */
export const getAnalyticsStats = async () => {
  const { data, error } = await supabase.rpc("admin_analytics_stats");
  if (error) throw error;
  return data;
};
