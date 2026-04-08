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