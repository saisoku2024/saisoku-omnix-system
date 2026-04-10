export const API_BASE = "http://127.0.0.1:8001/api";

const DEFAULT_YEAR = 2026;
const DEFAULT_GRANULARITY = "month";

function withDefaultQuery(path: string) {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}year=${DEFAULT_YEAR}&granularity=${DEFAULT_GRANULARITY}`;
}

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${withDefaultQuery(path)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }

  return res.json();
}

/* =========================
   HOME
========================= */
export async function getDashboardSummary() {
  return apiFetch("/dashboard/summary");
}

export async function getDashboardTrend() {
  return apiFetch("/dashboard/trend");
}

export async function getDashboardByChannel() {
  return apiFetch("/dashboard/by-channel");
}

/* =========================
   VOICE
========================= */
export async function getVoiceSummary() {
  return apiFetch("/dashboard/voice/summary");
}

export async function getVoiceDaily() {
  return apiFetch("/dashboard/voice/daily");
}

export async function getVoiceByHour() {
  return apiFetch("/dashboard/voice/by-hour");
}

export async function getVoiceByDay() {
  return apiFetch("/dashboard/voice/by-day");
}

export async function getVoiceByAgent() {
  return apiFetch("/dashboard/voice/by-agent");
}

/* =========================
   CSAT
========================= */
export async function getCsatSummary() {
  return apiFetch("/dashboard/csat/summary");
}

export async function getCsatRatingBreakdown() {
  return apiFetch("/dashboard/csat/rating-breakdown");
}

export async function getCsatMonthlyScore() {
  return apiFetch("/dashboard/csat/monthly-score");
}

export async function getCsatByAgent() {
  return apiFetch("/dashboard/csat/by-agent");
}