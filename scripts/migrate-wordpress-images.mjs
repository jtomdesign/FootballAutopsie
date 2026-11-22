#!/usr/bin/env node
/**
 * Downloads all images referenced by a WordPress WXR export into
 * public/wp-content/uploads/ and writes scripts/wp-image-map.json
 * mapping absolute WP URLs -> local paths.
 *
 * Usage: node scripts/migrate-wordpress-images.mjs [export.xml]
 */
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const [, , xmlPath = "/Users/JtomDesign/Downloads/footballautopsie.WordPress.2026-11-22.xml"] = process.argv;
const OUT_DIR = new URL("../public/wp-content/uploads/", import.meta.url).pathname;
const MAP_PATH = new URL("./wp-image-map.json", import.meta.url).pathname;

const xml = fs.readFileSync(xmlPath, "utf8");
const doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false }).parse(xml);
const items = Array.isArray(doc.rss.channel.item) ? doc.rss.channel.item : [doc.rss.channel.item];
const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

// collect every image URL: attachments + <img> in post content
const urls = new Set();
for (const it of items) {
  if (it["wp:post_type"] === "attachment") {
    const u = it["wp:attachment_url"] || it.guid?.["#text"];
    if (u && /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(u)) urls.add(u);
  }
  if (it["wp:post_type"] === "post") {
    for (const m of String(it["content:encoded"] ?? "").matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      if (/^https?:\/\//i.test(m[1])) urls.add(m[1]);
    }
  }
}

// local path = URL pathname under /wp-content/uploads/ (fallback: hashed name)
const toLocal = url => {
  try {
    const p = new URL(url).pathname;
    const i = p.indexOf("/wp-content/uploads/");
    if (i >= 0) return p.slice(i + 1); // wp-content/uploads/...
  } catch {}
  const ext = path.extname(new URL(url).pathname) || ".jpg";
  return `wp-content/uploads/migrated/${Buffer.from(url).toString("hex").slice(0, 24)}${ext}`;
};

const jobs = [...urls].map(u => ({ url: u, local: toLocal(u) }));
console.log(`${jobs.length} images to download`);

let ok = 0, fail = 0;
const map = {};
const CONCURRENCY = 8;

async function worker(queue) {
  while (queue.length) {
    const { url, local } = queue.shift();
    const dest = path.join(OUT_DIR, local.replace(/^wp-content\/uploads\//, ""));
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 100) throw new Error("suspiciously small");
        fs.writeFileSync(dest, buf);
      }
      map[url] = `/${local}`;
      ok++;
    } catch (e) {
      fail++;
      console.warn(`FAIL ${url} -> ${e.message}`);
    }
    if ((ok + fail) % 25 === 0) console.log(`  ${ok + fail}/${jobs.length}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(jobs)));

fs.mkdirSync(path.dirname(MAP_PATH), { recursive: true });
fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
console.log(`Done: ${ok} downloaded, ${fail} failed -> ${MAP_PATH}`);
