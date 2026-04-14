import { fetchAPI } from "./api";

export async function getDashboardData() {
  return fetchAPI("/api/dashboard/summary");
}