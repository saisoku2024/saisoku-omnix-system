export const API_BASE = "http://127.0.0.1:8001/api";

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }

  return res.json();
}

export async function getDashboardSummary() {
  return apiFetch("/dashboard/summary");
}

export async function getDashboardTrend() {
  return apiFetch("/dashboard/trend");
}

export async function getDashboardByChannel() {
  return apiFetch("/dashboard/by-channel");
}

export async function getVoiceSummary() {
  return apiFetch("/dashboard/voice/summary");
}

export async function getCsatSummary() {
  return apiFetch("/dashboard/csat/summary");
}