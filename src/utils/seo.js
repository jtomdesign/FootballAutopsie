import { useEffect } from "react";

export const SITE_URL =
  import.meta.env.VITE_SITE_URL || "https://www.footautopsie.com";
export const SITE_NAME = "Football Autopsie";
export const DEFAULT_DESCRIPTION =
  "Football Autopsie — Actualités football, matchs en direct, classements, équipes et joueurs.";

const upsertMeta = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel, href) => {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const JSONLD_ID = "fa-jsonld";

/**
 * Per-page SEO: title, description, canonical, robots, Open Graph,
 * Twitter card, article meta and JSON-LD structured data.
 *
 *   useSEO({
 *     title: "Man City vs Arsenal",
 *     description: "...",
 *     path: "/match/123",
 *     image: "https://...",
 *     type: "article",               // article | website
 *     noindex: true,                 // dashboard/private pages
 *     publishedTime, modifiedTime, author,
 *     jsonLd: { "@context": "https://schema.org", ... },
 *   });
 */
export const useSEO = ({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noindex = false,
  publishedTime,
  modifiedTime,
  author,
  jsonLd,
} = {}) => {
  useEffect(() => {
    const fullTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title} — ${SITE_NAME}`
      : `${SITE_NAME} — Football, News & Scores en direct`;
    document.title = fullTitle;

    const url = `${SITE_URL}${path}`;
    const desc = description || DEFAULT_DESCRIPTION;
    // og:image must be absolute — featured images are often stored as
    // site-relative paths (/wp-content/...) which scrapers can't fetch
    const absImage = image
      ? image.startsWith("http")
        ? image
        : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`
      : undefined;

    upsertMeta("name", "description", desc);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    upsertLink("canonical", url);

    // Open Graph
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "fr_FR");
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:url", url);
    if (absImage) {
      upsertMeta("property", "og:image", absImage);
      upsertMeta("property", "og:image:width", "1200");
      upsertMeta("property", "og:image:height", "630");
      upsertMeta("property", "og:image:alt", fullTitle);
    }
    if (publishedTime)
      upsertMeta("property", "article:published_time", publishedTime);
    if (modifiedTime)
      upsertMeta("property", "article:modified_time", modifiedTime);
    if (author) upsertMeta("property", "article:author", author);

    // Twitter / X card
    upsertMeta("name", "twitter:card", absImage ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    if (absImage) upsertMeta("name", "twitter:image", absImage);

    // JSON-LD structured data
    document.getElementById(JSONLD_ID)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = JSONLD_ID;
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(JSONLD_ID)?.remove();
    };
  }, [
    title,
    description,
    path,
    image,
    type,
    noindex,
    publishedTime,
    modifiedTime,
    author,
    jsonLd,
  ]);
};

/** Truncate text for meta descriptions (~155 chars). */
export const metaDescription = (text, max = 155) => {
  if (!text) return null;
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

/**
 * One-time site integrations: search-console verification meta tags and
 * optional GA4. All values come from env vars — nothing is hardcoded.
 */
export const useSiteIntegrations = () => {
  useEffect(() => {
    const verifications = {
      "google-site-verification": import.meta.env.VITE_GSC_VERIFICATION,
      "msvalidate.01": import.meta.env.VITE_BING_VERIFICATION,
      "yandex-verification": import.meta.env.VITE_YANDEX_VERIFICATION,
    };
    for (const [name, content] of Object.entries(verifications)) {
      if (content) upsertMeta("name", name, content);
    }

    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && !document.getElementById("fa-ga4")) {
      const s = document.createElement("script");
      s.id = "fa-ga4";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", gaId);
    }
  }, []);
};

/** Site-wide Organization + WebSite JSON-LD, injected once. */
export const siteJsonLd = () => [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.jpg`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr",
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];
