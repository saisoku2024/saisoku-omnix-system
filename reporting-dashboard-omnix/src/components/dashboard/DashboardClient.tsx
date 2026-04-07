"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  fetchSummary,
  fetchTrend,
  fetchByChannel,
  Granularity,
} from "@/lib/dashboard-api";

type SummaryResponse = {
  summary: {
    total_cases: number;
    open_cases: number;
    closed_cases: number;
  };
};

type TrendResponse = {
  group_by: string;
  data: { label: string; total_cases: number }[];
};

type ByChannelResponse = {
  data: { channel: string; total_cases: number }[];
};

type VoiceSummaryResponse = {
  summary: {
    total_calls: number;
    avg_wait_time_sec: number;
    avg_talk_time_sec: number;
    avg_hold_time_sec: number;
    answered_calls: number;
    abandoned_calls: number;
  };
};

type CsatSummaryResponse = {
  summary: {
    total_responses: number;
    avg_rating: number;
    rating_distribution: { rating: string; total: number }[];
  };
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8001";

const monthOptions = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const quarterOptions = [
  { label: "Q1", value: 1 },
  { label: "Q2", value: 2 },
  { label: "Q3", value: 3 },
  { label: "Q4", value: 4 },
];

const pieColors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getActivePeriodLabel(
  granularity: Granularity,
  year: number,
  month: number,
  quarter: number
) {
  if (granularity === "month") {
    const monthLabel =
      monthOptions.find((item) => item.value === month)?.label ?? `Month ${month}`;
    return `${monthLabel} ${year}`;
  }

  if (granularity === "quarter") {
    return `Q${quarter} ${year}`;
  }

  return `${year}`;
}

function buildQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  });

  return search.toString();
}

export default function DashboardClient() {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(1);
  const [quarter, setQuarter] = useState<number>(1);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [byChannel, setByChannel] = useState<ByChannelResponse | null>(null);
  const [voiceSummary, setVoiceSummary] = useState<VoiceSummaryResponse | null>(null);
  const [csatSummary, setCsatSummary] = useState<CsatSummaryResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const activePeriodLabel = useMemo(
    () => getActivePeriodLabel(granularity, year, month, quarter),
    [granularity, year, month, quarter]
  );

  const currentParams = useMemo(() => {
    return granularity === "month"
      ? { granularity, year, month }
      : granularity === "quarter"
      ? { granularity, year, quarter }
      : { granularity, year };
  }, [granularity, year, month, quarter]);

  const closeRate = useMemo(() => {
    const total = summary?.summary.total_cases ?? 0;
    const closed = summary?.summary.closed_cases ?? 0;
    if (!total) return 0;
    return Math.round((closed / total) * 100);
  }, [summary]);

  async function fetchVoiceSummary(params: Record<string, string | number | undefined>) {
    const query = buildQueryString(params);
    const res = await fetch(`${BACKEND_URL}/api/dashboard/voice/summary?${query}`);
    if (!res.ok) throw new Error(`Voice summary error: HTTP ${res.status}`);
    return (await res.json()) as VoiceSummaryResponse;
  }

  async function fetchCsatSummary(params: Record<string, string | number | undefined>) {
    const query = buildQueryString(params);
    const res = await fetch(`${BACKEND_URL}/api/dashboard/csat/summary?${query}`);
    if (!res.ok) throw new Error(`CSAT summary error: HTTP ${res.status}`);
    return (await res.json()) as CsatSummaryResponse;
  }

  async function loadDashboard(isManualRefresh = false) {
    try {
      setError("");

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [summaryData, trendData, byChannelData, voiceData, csatData] =
        await Promise.all([
          fetchSummary(currentParams),
          fetchTrend(currentParams),
          fetchByChannel(currentParams),
          fetchVoiceSummary(currentParams),
          fetchCsatSummary(currentParams),
        ]);

      setSummary(summaryData);
      setTrend(trendData);
      setByChannel(byChannelData);
      setVoiceSummary(voiceData);
      setCsatSummary(csatData);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, year, month, quarter]);

  const yearOptions = [2024, 2025, 2026];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#081225] via-[#0b1730] to-[#07111f] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Insight Hub
                  </div>
                  <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                    Reporting Dashboard OMNIX
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Unified operational visibility for OMNIX tickets, Voice interactions,
                    and CSAT performance in one executive workspace.
                  </p>
                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right lg:block">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Active Period
                  </div>
                  <div className="mt-1 text-sm font-medium text-cyan-300">
                    {activePeriodLabel}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <HeroMiniCard
                  title="OMNIX Cases"
                  value={summary?.summary.total_cases ?? 0}
                  tone="blue"
                />
                <HeroMiniCard
                  title="Voice Calls"
                  value={voiceSummary?.summary.total_calls ?? 0}
                  tone="amber"
                />
                <HeroMiniCard
                  title="CSAT Avg"
                  value={formatDecimal(csatSummary?.summary.avg_rating ?? 0)}
                  tone="green"
                />
              </div>
            </div>

            <div className="p-8">
              <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Filter Controls
              </div>

              <div className="space-y-4">
                <FilterField label="Period Type">
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as Granularity)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
                  >
                    <option value="month" className="text-black">Month</option>
                    <option value="quarter" className="text-black">Quarter</option>
                    <option value="year" className="text-black">Year</option>
                  </select>
                </FilterField>

                <FilterField label="Year">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
                  >
                    {yearOptions.map((item) => (
                      <option key={item} value={item} className="text-black">
                        {item}
                      </option>
                    ))}
                  </select>
                </FilterField>

                {granularity === "month" && (
                  <FilterField label="Month">
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
                    >
                      {monthOptions.map((item) => (
                        <option key={item.value} value={item.value} className="text-black">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </FilterField>
                )}

                {granularity === "quarter" && (
                  <FilterField label="Quarter">
                    <select
                      value={quarter}
                      onChange={(e) => setQuarter(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
                    >
                      {quarterOptions.map((item) => (
                        <option key={item.value} value={item.value} className="text-black">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </FilterField>
                )}

                <button
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshing ? "Refreshing..." : "Refresh Dashboard"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-28 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-28 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-28 animate-pulse rounded-3xl bg-white/5" />
            <div className="h-96 animate-pulse rounded-3xl bg-white/5 xl:col-span-3" />
            <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <ExecutiveKpiCard
                title="Total Cases"
                value={summary?.summary.total_cases ?? 0}
                subtitle="OMNIX ticket volume"
                accent="blue"
              />
              <ExecutiveKpiCard
                title="Voice Total Calls"
                value={voiceSummary?.summary.total_calls ?? 0}
                subtitle="Inbound interaction count"
                accent="amber"
              />
              <ExecutiveKpiCard
                title="CSAT Responses"
                value={csatSummary?.summary.total_responses ?? 0}
                subtitle="Collected survey responses"
                accent="green"
              />
              <ExecutiveKpiCard
                title="CSAT Avg Rating"
                value={formatDecimal(csatSummary?.summary.avg_rating ?? 0)}
                subtitle="Average customer satisfaction"
                accent="violet"
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                title="Close Rate"
                value={`${closeRate}%`}
                tone="slate"
              />
              <MetricTile
                title="Answered Calls"
                value={voiceSummary?.summary.answered_calls ?? 0}
                tone="blue"
              />
              <MetricTile
                title="Abandoned Calls"
                value={voiceSummary?.summary.abandoned_calls ?? 0}
                tone="amber"
              />
              <MetricTile
                title="Avg Wait Time"
                value={`${formatDecimal(voiceSummary?.summary.avg_wait_time_sec ?? 0)} sec`}
                tone="green"
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <GlassStatCard
                label="Open Cases"
                value={summary?.summary.open_cases ?? 0}
              />
              <GlassStatCard
                label="Closed Cases"
                value={summary?.summary.closed_cases ?? 0}
              />
              <GlassStatCard
                label="Avg Talk Time"
                value={`${formatDecimal(voiceSummary?.summary.avg_talk_time_sec ?? 0)} sec`}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm xl:col-span-3">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Cases Trend</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Ticket volume trend for the selected period.
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">
                    OMNIX
                  </span>
                </div>

                {trend?.data?.length ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trend.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#243041" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "16px",
                            color: "#fff",
                          }}
                        />
                        <Bar
                          dataKey="total_cases"
                          fill="#3b82f6"
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No trend data available for the selected filter." />
                )}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Cases by Channel</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Distribution across available channels.
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Mix
                  </span>
                </div>

                {byChannel?.data?.length ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byChannel.data}
                          dataKey="total_cases"
                          nameKey="channel"
                          outerRadius={108}
                          innerRadius={56}
                          paddingAngle={3}
                          label
                        >
                          {byChannel.data.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.channel}`}
                              fill={pieColors[index % pieColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "16px",
                            color: "#fff",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No channel distribution data available." />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function HeroMiniCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | number;
  tone: "blue" | "amber" | "green";
}) {
  const toneMap = {
    blue: "from-blue-500/20 to-cyan-500/10 border-blue-400/20",
    amber: "from-amber-500/20 to-orange-500/10 border-amber-400/20",
    green: "from-emerald-500/20 to-green-500/10 border-emerald-400/20",
  };

  const displayValue =
    typeof value === "number" ? formatNumber(value) : value;

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br ${toneMap[tone]} p-5`}
    >
      <div className="text-sm text-slate-300">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{displayValue}</div>
    </div>
  );
}

function ExecutiveKpiCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  accent: "blue" | "amber" | "green" | "violet";
}) {
  const accentMap = {
    blue: "from-blue-600/20 to-cyan-500/10 border-blue-400/20 text-blue-300",
    amber: "from-amber-500/20 to-orange-500/10 border-amber-400/20 text-amber-300",
    green: "from-emerald-500/20 to-green-500/10 border-emerald-400/20 text-emerald-300",
    violet: "from-violet-500/20 to-fuchsia-500/10 border-violet-400/20 text-violet-300",
  };

  const displayValue =
    typeof value === "number" ? formatNumber(value) : value;

  return (
    <div
      className={`rounded-[28px] border bg-gradient-to-br ${accentMap[accent]} p-6 shadow-[0_10px_35px_rgba(0,0,0,0.2)]`}
    >
      <div className="mb-8 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          KPI
        </span>
      </div>

      <div className="text-4xl font-semibold tracking-tight text-white">
        {displayValue}
      </div>
      <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
    </div>
  );
}

function MetricTile({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | number;
  tone: "slate" | "blue" | "amber" | "green";
}) {
  const toneMap = {
    slate: "border-white/10 bg-white/[0.04]",
    blue: "border-blue-400/20 bg-blue-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    green: "border-emerald-400/20 bg-emerald-500/10",
  };

  const displayValue =
    typeof value === "number" ? formatNumber(value) : value;

  return (
    <div className={`rounded-3xl border ${toneMap[tone]} p-5`}>
      <div className="text-sm text-slate-300">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{displayValue}</div>
    </div>
  );
}

function GlassStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const displayValue =
    typeof value === "number" ? formatNumber(value) : value;

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{displayValue}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-96 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] text-sm text-slate-400">
      {message}
    </div>
  );
}