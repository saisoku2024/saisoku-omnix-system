const BASE_URL = "http://localhost:8001/api";

/**
 * Helper untuk mengubah object menjadi query string
 * Contoh: { mode: 'monthly', year: 2026 } -> ?mode=monthly&year=2026
 */
const buildQuery = (params?: Record<string, any>) => {
  if (!params) return "";
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== "")
  );
  const qs = new URLSearchParams(filteredParams).toString();
  return qs ? `?${qs}` : "";
};

async function fetchAPI(endpoint: string, params?: any) {
  try {
    const url = `${BASE_URL}${endpoint}${buildQuery(params)}`;
    console.log("Fetching:", url); // Untuk debug di console browser

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("FAILED API:", url);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("FETCH ERROR:", err);
    return null;
  }
}

/* =========================
   DASHBOARD (HOME) - FIXED
========================= */

export const getDashboardSummary = (params: any) =>
  fetchAPI("/dashboard/summary", params);

export const getDashboardTrend = (params: any) =>
  fetchAPI("/dashboard/trend", params);

export const getDashboardByChannel = (params: any) =>
  fetchAPI("/dashboard/by-channel", params);

/* =========================
   VOICE - FIXED
========================= */

export const getVoiceSummary = (params: any) =>
  fetchAPI("/dashboard/voice/summary", params);

export const getVoiceDaily = (params: any) =>
  fetchAPI("/dashboard/voice/daily", params);

export const getVoiceByHour = (params: any) =>
  fetchAPI("/dashboard/voice/by-hour", params);

export const getVoiceByDay = (params: any) =>
  fetchAPI("/dashboard/voice/by-day", params);

export const getVoiceByAgent = (params: any) =>
  fetchAPI("/dashboard/voice/by-agent", params);

/* =========================
   CSAT - FIXED
========================= */

export const getCsatSummary = (params: any) =>
  fetchAPI("/dashboard/csat/summary", params);

export const getCsatRatingBreakdown = (params: any) =>
  fetchAPI("/dashboard/csat/rating-breakdown", params);

export const getCsatMonthlyScore = (params: any) =>
  fetchAPI("/dashboard/csat/monthly-score", params);

export const getCsatByAgent = (params: any) =>
  fetchAPI("/dashboard/csat/by-agent", params);