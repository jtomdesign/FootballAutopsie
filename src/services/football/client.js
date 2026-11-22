// Supports two providers:
//  - RapidAPI:   host api-football-v1.p.rapidapi.com  (header x-rapidapi-key)
//  - API-Sports: host v3.football.api-sports.io      (header x-apisports-key)
// Override with VITE_FOOTBALL_API_HOST if needed.
const API_HOST =
  import.meta.env.VITE_FOOTBALL_API_HOST ??
  "api-football-v1.p.rapidapi.com";
const IS_API_SPORTS = API_HOST.includes("api-sports.io");
const API_BASE = IS_API_SPORTS ? `https://${API_HOST}` : `https://${API_HOST}`;

const RATE_LIMIT = {
  requests: 0,
  resetAt: 0,
};

function getApiKey() {
  const key = import.meta.env.VITE_FOOTBALL_API_KEY;
  if (!key) {
    throw new Error(
      "Missing VITE_FOOTBALL_API_KEY. Add your API-Football key to .env",
    );
  }
  return key;
}

async function waitForRateLimit() {
  const now = Date.now();
  if (RATE_LIMIT.requests >= 30 && now < RATE_LIMIT.resetAt) {
    const wait = RATE_LIMIT.resetAt - now;
    await new Promise(resolve => setTimeout(resolve, wait));
  }
}

/**
 * Central fetch wrapper for API-Football.
 * Returns the `response` array from the API payload.
 */
export async function footballApi(endpoint, params = {}) {
  await waitForRateLimit();

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const headers = IS_API_SPORTS
    ? { "x-apisports-key": getApiKey() }
    : {
        "x-rapidapi-host": API_HOST,
        "x-rapidapi-key": getApiKey(),
      };

  const res = await fetch(url.toString(), { headers });

  RATE_LIMIT.requests += 1;

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || 60;
    RATE_LIMIT.requests = 30;
    RATE_LIMIT.resetAt = Date.now() + retryAfter * 1000;
    throw new Error("Football API rate limit reached. Please try again shortly.");
  }

  if (!res.ok) {
    throw new Error(`Football API error (${res.status})`);
  }

  const payload = await res.json();

  if (payload?.errors && Object.keys(payload.errors).length > 0) {
    const messages = Object.values(payload.errors).flat().join(" ");
    throw new Error(messages || "Football API request failed");
  }

  return payload.response ?? [];
}
