import {
  getDashboardSummary,
  getDashboardTrend,
  getDashboardByChannel,
  getVoiceSummary,
  getCsatSummary,
} from "./api";

export async function loadDashboardData(startDate, endDate) {
  const [summary, trend, byChannel, voiceSummary, csatSummary] =
    await Promise.all([
      getDashboardSummary(startDate, endDate),
      getDashboardTrend(startDate, endDate),
      getDashboardByChannel(startDate, endDate),
      getVoiceSummary(startDate, endDate),
      getCsatSummary(startDate, endDate),
    ]);

  return {
    summary,
    trend,
    byChannel,
    voiceSummary,
    csatSummary,
  };
}