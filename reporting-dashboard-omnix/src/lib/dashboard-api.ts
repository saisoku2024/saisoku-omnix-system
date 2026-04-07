const API_BASE_URL = "http://localhost:8001/api";

export type Granularity = "month" | "quarter" | "year";

export type DashboardFilter = {
  granularity: Granularity;
  year: number;
  month?: number;
  quarter?: number;
};

function buildQuery(params: DashboardFilter) {
  const search = new URLSearchParams();
  search.set("granularity", params.granularity);
  search.set("year", String(params.year));

  if (params.month) {
    search.set("month", String(params.month));
  }

  if (params.quarter) {
    search.set("quarter", String(params.quarter));
  }

  return search.toString();
}

export async function fetchSummary(params: DashboardFilter) {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary?${buildQuery(params)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch summary");
  }

  return res.json();
}

export async function fetchTrend(params: DashboardFilter) {
  const res = await fetch(`${API_BASE_URL}/dashboard/trend?${buildQuery(params)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch trend");
  }

  return res.json();
}

export async function fetchByChannel(params: DashboardFilter) {
  const res = await fetch(`${API_BASE_URL}/dashboard/by-channel?${buildQuery(params)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch by channel");
  }

  return res.json();
}