/**
 * Dynamic XML sitemap for Vercel serverless functions.
 * Served at /sitemap.xml via the vercel.json rewrite.
 *
 * Includes static public routes + every published article slug.
 * Set VITE_SITE_URL / VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in
 * the Vercel project environment (same values the frontend uses).
 */

const SITE_URL =
  process.env.VITE_SITE_URL || "https://www.footautopsie.com";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const STATIC_ROUTES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/news", priority: "0.9", changefreq: "hourly" },
  { loc: "/scores", priority: "0.8", changefreq: "hourly" },
  { loc: "/matchs", priority: "0.8", changefreq: "hourly" },
  { loc: "/ligues", priority: "0.8", changefreq: "daily" },
  { loc: "/equipes", priority: "0.8", changefreq: "daily" },
  { loc: "/joueurs", priority: "0.7", changefreq: "daily" },
  { loc: "/recherche", priority: "0.4", changefreq: "monthly" },
  { loc: "/contact", priority: "0.3", changefreq: "yearly" },
];

const escapeXml = s =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const urlEntry = ({ loc, lastmod, priority, changefreq }) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${loc}`)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ""}${priority ? `\n    <priority>${priority}</priority>` : ""}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ""}
  </url>`;

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");

  const entries = [...STATIC_ROUTES];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const now = new Date().toISOString();
      const url =
        `${SUPABASE_URL}/rest/v1/Posts` +
        `?select=slug,created_at,updated_at` +
        `&or=(status.eq.published,and(status.eq.scheduled,publishAt.lte.${now}))` +
        `&order=created_at.desc&limit=5000`;
      const r = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (r.ok) {
        const posts = await r.json();
        for (const p of posts ?? []) {
          if (!p.slug) continue;
          entries.push({
            loc: `/news/${p.slug}`,
            lastmod: p.updated_at ?? p.created_at ?? null,
            priority: "0.7",
            changefreq: "weekly",
          });
        }
      }
    } catch {
      /* sitemap still serves static routes if Supabase is unreachable */
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlEntry).join("\n")}
</urlset>`;

  res.status(200).send(xml);
}
