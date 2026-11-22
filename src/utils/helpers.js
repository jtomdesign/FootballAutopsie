import i18n from "../i18n";

const locale = () => (i18n.language?.startsWith("en") ? "en-GB" : "fr-FR");

//Date format

export function formatDate(date) {
  return new Intl.DateTimeFormat(locale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date) {
  return new Intl.DateTimeFormat(locale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat(locale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

//Football match helpers

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** e.g. "Aujourd'hui", "Demain", "Hier", "sam. 22 nov." */
export function formatMatchDay(date) {
  const target = startOfDay(date);
  const today = startOfDay(new Date());
  const diff = Math.round((target - today) / DAY_MS);

  if (diff === 0) return i18n.t("Aujourd'hui");
  if (diff === 1) return i18n.t("Demain");
  if (diff === -1) return i18n.t("Hier");

  return new Intl.DateTimeFormat(locale(), {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

/** e.g. "14:30" */
export function formatMatchTime(date) {
  return new Intl.DateTimeFormat(locale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

/** e.g. "14:30" — used inside match rows */
export function formatMatchDateTime(date) {
  return formatMatchTime(date);
}

/** word count from HTML or plain text */
export function countWords(htmlOrText) {
  if (!htmlOrText) return 0;
  const text = String(htmlOrText)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

/** reading time in minutes (~200 wpm) */
export function readingTimeFromHtml(html) {
  const words = countWords(html);
  return Math.max(1, Math.ceil(words / 200));
}

const COUNTRY_ISO = {
  France: "FR", England: "GB-ENG", "United Kingdom": "GB", Scotland: "GB-SCT",
  Wales: "GB-WLS", Ireland: "IE", "Northern Ireland": "GB-NIR",
  Spain: "ES", Germany: "DE", Italy: "IT", Portugal: "PT", Netherlands: "NL",
  Belgium: "BE", Switzerland: "CH", Austria: "AT", Croatia: "HR",
  Serbia: "RS", Denmark: "DK", Sweden: "SE", Norway: "NO", Finland: "FI",
  Poland: "PL", Czechia: "CZ", "Czech Republic": "CZ", Slovakia: "SK",
  Hungary: "HU", Romania: "RO", Bulgaria: "BG", Greece: "GR", Turkey: "TR",
  Ukraine: "UA", Russia: "RU", "Bosnia and Herzegovina": "BA",
  "North Macedonia": "MK", Albania: "AL", Slovenia: "SI", Montenegro: "ME",
  Kosovo: "XK", Iceland: "IS", Georgia: "GE", Armenia: "AM", Azerbaijan: "AZ",
  Israel: "IL", Morocco: "MA", Algeria: "DZ", Tunisia: "TN", Egypt: "EG",
  Nigeria: "NG", Ghana: "GH", Senegal: "SN", Cameroon: "CM", "Ivory Coast": "CI",
  "Côte d'Ivoire": "CI", Mali: "ML", "Burkina Faso": "BF", Congo: "CG",
  "DR Congo": "CD", Gabon: "GA", "South Africa": "ZA", Kenya: "KE",
  Brazil: "BR", Argentina: "AR", Uruguay: "UY", Colombia: "CO", Chile: "CL",
  Paraguay: "PY", Peru: "PE", Ecuador: "EC", Venezuela: "VE", Bolivia: "BO",
  Mexico: "MX", "United States": "US", "United States of America": "US",
  Canada: "CA", Jamaica: "JM", Panama: "PA", "Costa Rica": "CR",
  "El Salvador": "SV", Honduras: "HN", Guatemala: "GT", Cuba: "CU",
  Japan: "JP", "South Korea": "KR", China: "CN", Australia: "AU",
  "Saudi Arabia": "SA", Iran: "IR", Iraq: "IQ", Qatar: "QA",
  "United Arab Emirates": "AE", Uzbekistan: "UZ", Kazakhstan: "KZ",
  India: "IN", Indonesia: "ID", Thailand: "TH", Vietnam: "VN",
};

/** Flag emoji for a country name (API returns e.g. "France"). */
export function countryFlag(nationality) {
  const iso = COUNTRY_ISO[nationality];
  if (!iso) return null;
  // GB-ENG / GB-SCT etc. aren't valid ISO pairs — fall back to GB
  const code = iso.includes("-") ? "GB" : iso;
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

//Slugify

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD") // Remove accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Spaces → hyphens
    .replace(/-+/g, "-"); // Remove duplicate hyphens
}
