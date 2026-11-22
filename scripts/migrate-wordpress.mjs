#!/usr/bin/env node
/**
 * Migrates a WordPress WXR export into the Supabase "Posts"/"Categories" tables.
 *
 * Usage:
 *   node scripts/migrate-wordpress.mjs <path-to-export.xml> [output.sql]
 *
 * Generates a SQL file to run once in the Supabase SQL Editor.
 * Posts keep their WP slug, date and content (Gutenberg block comments stripped).
 * Featured images point to the old WP uploads URLs — re-host them later if needed.
 */
import fs from "node:fs";
import { XMLParser } from "fast-xml-parser";

const [, , xmlPath = "/Users/JtomDesign/Downloads/footballautopsie.WordPress.2026-11-22.xml", outPath = "wordpress_import.sql"] = process.argv;

const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const get = k => (env.match(new RegExp(`${k}=(.*)`)) || [])[1]?.trim();
const SUPA_URL = get("VITE_SUPABASE_URL");
const SUPA_KEY = get("VITE_SUPABASE_PUBLISHABLE_KEY") || get("VITE_SUPABASE_ANON_KEY");

const xml = fs.readFileSync(xmlPath, "utf8");
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false });
const doc = parser.parse(xml);
const channel = doc.rss.channel;
const items = Array.isArray(channel.item) ? channel.item : [channel.item];

const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
const txt = v => (v == null ? "" : typeof v === "string" ? v : v["#text"] ?? "");

// ---------- helpers ----------
const stripTags = html =>
  String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const cleanContent = html =>
  String(html ?? "")
    .replace(/<!--\s*\/??wp:[^>]*-->/g, "") // Gutenberg block markers
    .replace(/<!--\s*more\s*-->/g, "")
    .trim();

const slugify = s =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "article";

const esc = s => String(s ?? "").replace(/'/g, "''");
const q = s => `'${esc(s)}'`;

const wordCount = html => stripTags(html).split(/\s+/).filter(Boolean).length;
const readingTime = html => String(Math.max(1, Math.ceil(wordCount(html) / 200)));

const STATUS_MAP = { publish: "published", draft: "draft", private: "draft", pending: "draft" };

// WP URL -> local /wp-content/... path (produced by migrate-wordpress-images.mjs)
const MAP_PATH = new URL("./wp-image-map.json", import.meta.url).pathname;
const urlMap = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) : {};
const rewrite = html => {
  let out = String(html ?? "");
  for (const [from, to] of Object.entries(urlMap)) out = out.split(from).join(to);
  return out;
};

const PALETTE = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

// ---------- collect ----------
const attachments = new Map(); // wp post_id -> image url
const allItems = items;
for (const it of allItems) {
  if (it["wp:post_type"] === "attachment") {
    const url = it["wp:attachment_url"] || txt(it.guid);
    if (url) attachments.set(String(it["wp:post_id"]), url);
  }
}

const posts = allItems.filter(i => i["wp:post_type"] === "post" && i["wp:status"] !== "auto-draft");

// existing slugs (public select) to avoid collisions
const existing = new Set();
try {
  const r = await fetch(`${SUPA_URL}/rest/v1/Posts?select=slug&limit=1000`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (r.ok) for (const row of await r.json()) existing.add(row.slug);
} catch { /* offline is fine — dedupe within file still applies */ }

const usedSlugs = new Set(existing);
const fileSlugs = new Set();
const categorySlugs = new Map(); // wp cat name -> our slug
const categoryNames = new Map(); // slug -> display name
const rows = [];

for (const p of posts) {
  const status = STATUS_MAP[p["wp:status"]] ?? "draft";
  let slug = slugify(p["wp:post_name"] || p.title);
  const isUpdate = existing.has(slug);
  if (!isUpdate) {
    while (usedSlugs.has(slug) || fileSlugs.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    usedSlugs.add(slug);
    fileSlugs.add(slug);
  }

  const content = cleanContent(txt(p["content:encoded"]));

  // first WP category (domain="category")
  const cats = arr(p.category).filter(c => c["@_domain"] === "category");
  const wpCatName = cats.length ? txt(cats[0]["#text"]) || cats[0]["@_nicename"] : "";
  let catSlug = null;
  if (wpCatName) {
    catSlug = slugify(wpCatName);
    if (!categorySlugs.has(wpCatName)) {
      categorySlugs.set(wpCatName, catSlug);
      categoryNames.set(catSlug, wpCatName);
    }
  }

  // featured image: _thumbnail_id -> attachment, else first <img> in content
  let featured = null;
  const metas = arr(p["wp:postmeta"]);
  const thumb = metas.find(m => m["wp:meta_key"] === "_thumbnail_id");
  if (thumb?.["wp:meta_value"] && attachments.has(String(thumb["wp:meta_value"]))) {
    featured = attachments.get(String(thumb["wp:meta_value"]));
  }
  if (!featured) {
    const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m) featured = m[1];
  }

  const excerpt = stripTags(txt(p["excerpt:encoded"])) || stripTags(content).slice(0, 160);
  const createdAt = p["wp:post_date_gmt"] ? `${p["wp:post_date_gmt"].replace(" ", "T")}Z` : null;

  rows.push({ slug, isUpdate, catSlug, createdAt, status, title: txt(p.title) || slug, excerpt, content, featured });
}

// ---------- emit SQL ----------
const out = [];
out.push("-- WordPress import generated by scripts/migrate-wordpress.mjs");
out.push("-- Run once in the Supabase SQL Editor. Safe to re-run (skips existing slugs).");
out.push("");

// categories
const catEntries = [...categoryNames.entries()];
if (catEntries.length) {
  out.push("-- Categories");
  catEntries.forEach(([slug, name], i) => {
    out.push(
      `insert into "Categories" (name, slug, color)\n` +
      `select ${q(name)}, ${q(slug)}, ${q(PALETTE[i % PALETTE.length])}\n` +
      `where not exists (select 1 from "Categories" where slug = ${q(slug)});`
    );
  });
  out.push("");
}

out.push(`-- Posts (${rows.length})`);
let inserts = 0, updates = 0;
for (const r of rows) {
  const content = rewrite(r.content);
  const featured = r.featured ? rewrite(r.featured) : null;
  if (r.isUpdate) {
    updates++;
    out.push(
      `update "Posts" set\n` +
      `  excerpt = ${q(r.excerpt)},\n` +
      `  content = ${q(content)},\n` +
      `  "featuredImage" = ${featured ? q(featured) : "null"}\n` +
      `where slug = ${q(r.slug)};`
    );
    continue;
  }
  inserts++;
  const catExpr = r.catSlug
    ? `(select id from "Categories" where slug = ${q(r.catSlug)} limit 1)`
    : "null";
  out.push(
    `insert into "Posts" (title, slug, excerpt, content, "featuredImage", status, "categoryId", "authorId", "readingTime", "isBreaking", "publishAt", created_at)\n` +
    `select ${q(r.title)}, ${q(r.slug)}, ${q(r.excerpt)}, ${q(content)}, ${featured ? q(featured) : "null"}, ${q(r.status)}, ${catExpr}, null, ${q(readingTime(content))}, false, null, ${r.createdAt ? `${q(r.createdAt)}::timestamptz` : "now()"}\n` +
    `where not exists (select 1 from "Posts" where slug = ${q(r.slug)});`
  );
}

fs.writeFileSync(outPath, out.join("\n"));
console.log(`Parsed ${posts.length} WP posts -> ${inserts} inserts, ${updates} updates`);
console.log(`Categories: ${catEntries.length} (${catEntries.map(([s]) => s).join(", ")})`);
console.log(`Featured images found: ${rows.filter(r => r.featured).length}/${rows.length}`);
console.log(`Wrote ${outPath}`);
