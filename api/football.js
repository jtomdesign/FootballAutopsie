/**
 * Vercel serverless proxy for API-Football / API-Sports.
 *
 * Keeps the API key server-side (never shipped to the browser) and lets
 * Vercel's edge cache absorb repeated requests, drastically reducing the
 * number of calls that reach API-Sports.
 *
 * Request:  GET /api/football?path=/fixtures&live=all&date=2026-11-24
 * Response: the raw API-Sports JSON payload.
 *
 * Env (server-side, NOT VITE_ prefixed):
 *   FOOTBALL_API_KEY   — required (falls back to VITE_FOOTBALL_API_KEY)
 *   FOOTBALL_API_HOST  — optional, defaults to v3.football.api-sports.io
 */

const API_HOST =
  process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";
const API_KEY =
  process.env.FOOTBALL_API_KEY ?? process.env.VITE_FOOTBALL_API_KEY;

// Edge-cache TTL per endpoint type (seconds for s-maxage)
function cacheSeconds(pathname, params) {
  if (params.live) return 20; // live scores — short cache, still dedupes bursts
  if (pathname === "/fixtures") return params.date ? 300 : 300;
  if (pathname === "/fixture") return 60;
  if (
    pathname === "/standings" ||
    pathname === "/players/topscorers" ||
    pathname === "/players/topassists" ||
    pathname === "/leagues" ||
    pathname === "/teams" ||
    pathname === "/players" ||
    pathname === "/coachs" ||
    pathname === "/trophies" ||
    pathname === "/sidelined" ||
    pathname === "/injuries" ||
    pathname === "/odds" ||
    pathname === "/predictions"
  ) {
    return 3600;
  }
  return 300;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "Football API key not configured on server" });
  }

  const { path, ...params } = req.query;
  const pathname = String(path ?? "");
  if (!pathname.startsWith("/")) {
    return res.status(400).json({ error: "Missing or invalid 'path' param" });
  }

  const upstream = new URL(`https://${API_HOST}${pathname}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") upstream.searchParams.set(k, String(v));
  });

  try {
    const r = await fetch(upstream.toString(), {
      headers: { "x-apisports-key": API_KEY },
    });

    const sMaxAge = cacheSeconds(pathname, params);
    res.setHeader(
      "Cache-Control",
      `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 2}`,
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    const body = await r.text();
    const retryAfter = r.headers.get("retry-after");
    if (retryAfter) res.setHeader("Retry-After", retryAfter);
    return res.status(r.status).send(body);
  } catch (e) {
    return res.status(502).json({ error: "Upstream football API error" });
  }
}
