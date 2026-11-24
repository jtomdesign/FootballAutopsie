/**
 * AI football assistant — Vercel serverless endpoint.
 *
 * POST /api/ai-chat  { messages: [{role, content}, ...] }
 * Returns OpenAI-style { choices: [{ message: { content } }] }.
 *
 * Provider-agnostic: any OpenAI-compatible chat-completions API works.
 * Defaults to Google Gemini's OpenAI-compatible endpoint (free tier).
 *
 * Env (server-side):
 *   AI_API_KEY    — required
 *   AI_BASE_URL   — optional, default Gemini OpenAI-compat
 *   AI_MODEL      — optional, default gemini-2.0-flash
 *   FOOTBALL_API_KEY / FOOTBALL_API_HOST — optional, used to ground
 *     answers with today's real fixtures (cached 60s in-memory)
 */

const AI_BASE_URL =
  process.env.AI_BASE_URL ??
  "https://generativelanguage.googleapis.com/v1beta/openai";
const AI_MODEL = process.env.AI_MODEL ?? "gemini-2.0-flash";
const AI_KEY = process.env.AI_API_KEY;
const FB_KEY = process.env.FOOTBALL_API_KEY ?? process.env.VITE_FOOTBALL_API_KEY;
const FB_HOST = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";

// In-memory cache so bursts of chat messages don't hammer API-Sports
let fixturesCache = { at: 0, data: "" };

async function getFixturesContext() {
  if (!FB_KEY || Date.now() - fixturesCache.at < 60 * 1000) {
    return fixturesCache.data;
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const lines = [];
    for (const params of [
      { live: "all" },
      { date: today },
    ]) {
      const qs = new URLSearchParams(params).toString();
      const r = await fetch(`https://${FB_HOST}/fixtures?${qs}`, {
        headers: { "x-apisports-key": FB_KEY },
      });
      if (!r.ok) continue;
      const j = await r.json();
      for (const f of (j.response ?? []).slice(0, 25)) {
        const league = f.league?.name ?? "";
        const home = f.teams?.home?.name ?? "?";
        const away = f.teams?.away?.name ?? "?";
        const gh = f.goals?.home ?? 0;
        const ga = f.goals?.away ?? 0;
        const st = f.fixture?.status?.short ?? "";
        const elapsed = f.fixture?.status?.elapsed;
        lines.push(
          `- ${league} | ${home} ${gh}-${ga} ${away} [${st}${elapsed ? ` ${elapsed}'` : ""}]`,
        );
      }
    }
    fixturesCache = { at: Date.now(), data: lines.slice(0, 40).join("\n") };
  } catch {
    /* context is best-effort */
  }
  return fixturesCache.data;
}

const SYSTEM_PROMPT = context => `Tu es l'assistant football de Football Autopsie, un média football francophone. Tu réponds de manière concise, précise et passionnée, en français par défaut (adapte-toi à la langue de l'utilisateur).

Tu peux aider sur : pronostics et analyses de matchs, stats de joueurs et d'équipes, classements, transferts, règles du football, et toute question football générale.

Règles :
- Donne ton analyse honnête : pour les pronostics, donne un pronostic + justification, mais rappelle que le foot reste imprévisible.
- Tes connaissances ont une date de coupure ; pour les infos très récentes (dernières news, transferts du jour, blessés), dis-le clairement et base-toi sur les données en temps réel fournies ci-dessous quand elles sont pertinentes.
- Sois concis : réponses courtes sauf si l'utilisateur demande du détail.
- Pas de markdown lourd : texte simple avec des retours à la ligne, listes à puces "-" si utile.

Date du jour : ${new Date().toISOString().slice(0, 10)}

Matchs en direct et du jour (données API-Football temps réel) :
${context || "Aucune donnée de match disponible pour le moment."}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!AI_KEY) {
    return res
      .status(500)
      .json({ error: "Assistant IA non configuré (AI_API_KEY manquante)" });
  }

  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "messages requis" });
  }
  // Cap payload size
  const clean = messages
    .slice(-20)
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 4000),
    }));

  try {
    const context = await getFixturesContext();
    const r = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT(context) },
          ...clean,
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) {
      return res.status(r.status).json({
        error: data?.error?.message ?? "Erreur du fournisseur IA",
      });
    }
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: "Assistant IA indisponible" });
  }
}
