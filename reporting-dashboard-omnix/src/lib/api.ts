export const API_BASE = "http://localhost:8001/api";

const DEFAULT_YEAR = 2026;
const DEFAULT_GRANULARITY = "month";

function withDefaultQuery(path: string) {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}year=${DEFAULT_YEAR}&granularity=${DEFAULT_GRANULARITY}`;
}

async function apiFetch(path: string) {
  try {
    const res = await fetch(`${API_BASE}${withDefaultQuery(path)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function getDashboardSummary() { return apiFetch("/dashboard/summary"); }
export async function getDashboardTrend() { return apiFetch("/dashboard/trend"); }
export async function getDashboardByChannel() { return apiFetch("/dashboard/by-channel"); }