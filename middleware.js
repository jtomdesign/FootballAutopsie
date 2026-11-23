// Vercel Edge Middleware — serves crawler-ready Open Graph tags for
// /news/:slug so social previews show the article title + featured image
// even though the app is a client-rendered SPA.
//
// Only social/link-preview bots get the injected HTML; real users and
// search engines pass through to the SPA untouched.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  "https://kpzyizrurondyiorukqx.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_EMAXqhKPQwx9J06RBOIBVw_MEl2yN0T";
const SITE_URL =
  process.env.VITE_SITE_URL ?? "https://www.footautopsie.com";
const DEFAULT_IMAGE = `${SITE_URL}/wp-content/uploads/2025/12/Barca-prince-1.jpg`;

const BOT_UA =
  /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|telegrambot|discordbot|slackbot|pinterest|vkshare|redditbot|embedly|iframely|quora link preview|showyoubot|outbrain|waka/i;

export const config = {
  matcher: ["/news/:slug"],
};

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const meta = (attr, key, content) =>
  `<meta ${attr}="${key}" content="${esc(content)}" />`;

export default async function middleware(request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT_UA.test(ua)) return; // real users / search engines → SPA

  const { pathname } = new URL(request.url);
  const slug = decodeURIComponent(
    pathname.replace(/^\/news\//, "").replace(/\/+$/, ""),
  );
  if (!slug || slug.includes("/")) return;

  try {
    const now = new Date().toISOString();
    const api =
      `${SUPABASE_URL}/rest/v1/Posts` +
      `?slug=eq.${encodeURIComponent(slug)}` +
      `&select=title,excerpt,featuredImage,Categories(name)` +
      `&or=(status.eq.published,and(status.eq.scheduled,publishAt.lte.${now}))` +
      `&limit=1`;
    const res = await fetch(api, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) return;
    const rows = await res.json();
    const post = rows?.[0];
    if (!post?.title) return;

    const title = `${post.title} — Football Autopsie`;
    const desc = String(post.excerpt || "Article Football Autopsie").slice(0, 300);
    let image = post.featuredImage || DEFAULT_IMAGE;
    if (image.startsWith("/")) image = `${SITE_URL}${image}`;
    const url = `${SITE_URL}/news/${slug}`;
    const category =
      post.Categories?.name ?? post.Categories?.[0]?.name ?? null;

    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${esc(url)}" />
${meta("property", "og:site_name", "Football Autopsie")}
${meta("property", "og:type", "article")}
${meta("property", "og:title", title)}
${meta("property", "og:description", desc)}
${meta("property", "og:url", url)}
${meta("property", "og:image", image)}
${category ? meta("property", "article:section", category) : ""}
${meta("name", "twitter:card", "summary_large_image")}
${meta("name", "twitter:title", title)}
${meta("name", "twitter:description", desc)}
${meta("name", "twitter:image", image)}
</head>
<body></body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch {
    return; // on any failure, fall through to the normal SPA
  }
}
