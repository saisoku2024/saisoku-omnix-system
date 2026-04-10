"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDashboardSummary,
  getDashboardTrend,
  getDashboardByChannel,
  getVoiceSummary,
  getVoiceDaily,
  getVoiceByHour,
  getVoiceByDay,
  getVoiceByAgent,
  getCsatSummary,
  getCsatRatingBreakdown,
  getCsatMonthlyScore,
  getCsatByAgent,
} from "@/lib/api";
import {
  Home,
  BarChart3,
  Phone,
  SmilePlus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  CalendarDays,
  LayoutDashboard,
  RefreshCw,
  FileUp,
  Database,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type NavKey = "home" | "omnix" | "voice" | "csat" | "upload";
type ThemeMode = "dark" | "light";
type PeriodMode = "monthly" | "quarterly" | "yearly";

const homeSummaryByCategory = [
  { category: "Informasi", total: 8214 },
  { category: "Panduan", total: 6240 },
  { category: "Other", total: 2810 },
];

const homeSummaryByProduct = [
  { product: "Ecovacs", total: 4982 },
  { product: "Tineco", total: 3760 },
  { product: "Deebot", total: 2844 },
  { product: "Other Product", total: 1968 },
];

const omnixSummaryByChannel = [
  { channel: "WhatsApp", icon: "WA", total: 8420 },
  { channel: "Instagram", icon: "IG", total: 2816 },
  { channel: "Email", icon: "EM", total: 1934 },
  { channel: "Webform", icon: "WB", total: 1208 },
];

const omnixSummaryByCategory = [
  { category: "Informasi", total: 4628 },
  { category: "Panduan", total: 3894 },
  { category: "Other", total: 1856 },
];

const omnixSummaryByProduct = [
  { product: "Ecovacs", total: 4118 },
  { product: "Tineco", total: 3284 },
  { product: "Deebot", total: 2216 },
  { product: "Others", total: 760 },
];

const omnixDailyChatData = [
  { label: "1", total: 451 },
  { label: "2", total: 438 },
  { label: "3", total: 469 },
  { label: "4", total: 462 },
  { label: "5", total: 447 },
  { label: "6", total: 481 },
  { label: "7", total: 476 },
  { label: "8", total: 458 },
  { label: "9", total: 492 },
  { label: "10", total: 483 },
  { label: "11", total: 471 },
  { label: "12", total: 499 },
  { label: "13", total: 508 },
  { label: "14", total: 487 },
  { label: "15", total: 516 },
  { label: "16", total: 504 },
  { label: "17", total: 493 },
  { label: "18", total: 527 },
  { label: "19", total: 519 },
  { label: "20", total: 501 },
  { label: "21", total: 536 },
  { label: "22", total: 524 },
  { label: "23", total: 509 },
  { label: "24", total: 543 },
  { label: "25", total: 531 },
  { label: "26", total: 518 },
  { label: "27", total: 497 },
  { label: "28", total: 538 },
  { label: "29", total: 521 },
  { label: "30", total: 486 },
];

const omnixByHourData = [
  { label: "00", total: 18 },
  { label: "02", total: 7 },
  { label: "04", total: 3 },
  { label: "06", total: 14 },
  { label: "08", total: 123 },
  { label: "10", total: 248 },
  { label: "12", total: 221 },
  { label: "14", total: 276 },
  { label: "16", total: 261 },
  { label: "18", total: 174 },
  { label: "20", total: 82 },
  { label: "22", total: 28 },
];

const omnixByDayData = [
  { label: "Sen", total: 2386 },
  { label: "Sel", total: 2514 },
  { label: "Rab", total: 2461 },
  { label: "Kam", total: 2648 },
  { label: "Jum", total: 2789 },
  { label: "Sab", total: 1638 },
  { label: "Min", total: 1046 },
];

const omnixCaseInformasi = [
  { name: "Informasi Lokasi Service Center", total: 241 },
  { name: "Informasi Produk", total: 167 },
  { name: "Informasi Pembelian", total: 136 },
  { name: "Informasi Stock Unit", total: 100 },
  { name: "Informasi Progress Service", total: 95 },
];

const omnixCasePanduan = [
  { name: "Panduan Kendala Unit", total: 809 },
  { name: "Panduan Permintaan", total: 129 },
  { name: "Panduan Perawatan", total: 70 },
  { name: "Panduan Pemakaian", total: 30 },
  { name: "Ecovacs CareHub", total: 18 },
];

const omnixCaseOther = [
  { name: "Complaint Follow Up", total: 72 },
  { name: "Reschedule Visit", total: 54 },
  { name: "Garansi Unit", total: 49 },
  { name: "Refund Inquiry", total: 27 },
  { name: "Other Request", total: 19 },
];

const omnixCustomerSummary = [
  {
    title: "Customer by Month",
    value: "1,616",
    note: "Jumlah customer yang menghubungi OMNIX dilihat dari no hp / nama user IG / email sesuai filter aktif",
  },
  {
    title: "New Customer by Month",
    value: "1,431",
    note: "Jumlah customer baru dilihat dari no hp / nama user IG / email apakah sudah pernah masuk OMNIX atau belum",
  },
];

const voiceDailyCallData = [
  { label: "1", total: 124 },
  { label: "2", total: 118 },
  { label: "3", total: 130 },
  { label: "4", total: 126 },
  { label: "5", total: 121 },
  { label: "6", total: 135 },
  { label: "7", total: 132 },
  { label: "8", total: 128 },
  { label: "9", total: 139 },
  { label: "10", total: 134 },
  { label: "11", total: 129 },
  { label: "12", total: 141 },
  { label: "13", total: 144 },
  { label: "14", total: 136 },
  { label: "15", total: 149 },
  { label: "16", total: 145 },
  { label: "17", total: 138 },
  { label: "18", total: 153 },
  { label: "19", total: 147 },
  { label: "20", total: 142 },
  { label: "21", total: 156 },
  { label: "22", total: 151 },
  { label: "23", total: 143 },
  { label: "24", total: 159 },
  { label: "25", total: 154 },
  { label: "26", total: 146 },
  { label: "27", total: 140 },
  { label: "28", total: 152 },
  { label: "29", total: 148 },
  { label: "30", total: 133 },
];

const voiceByHourData = [
  { label: "00", total: 6 },
  { label: "02", total: 3 },
  { label: "04", total: 1 },
  { label: "06", total: 7 },
  { label: "08", total: 39 },
  { label: "10", total: 62 },
  { label: "12", total: 58 },
  { label: "14", total: 67 },
  { label: "16", total: 64 },
  { label: "18", total: 48 },
  { label: "20", total: 21 },
  { label: "22", total: 9 },
];

const voiceByDayData = [
  { label: "Sen", total: 742 },
  { label: "Sel", total: 798 },
  { label: "Rab", total: 776 },
  { label: "Kam", total: 823 },
  { label: "Jum", total: 861 },
  { label: "Sab", total: 534 },
  { label: "Min", total: 287 },
];

const agentCallHandling = [
  { agent: "Agent A", total: 342 },
  { agent: "Agent B", total: 318 },
  { agent: "Agent C", total: 301 },
  { agent: "Agent D", total: 287 },
  { agent: "Agent E", total: 266 },
];

const agentAvgHandling = [
  { agent: "Agent A", value: "03:12" },
  { agent: "Agent B", value: "03:28" },
  { agent: "Agent C", value: "03:35" },
  { agent: "Agent D", value: "03:51" },
  { agent: "Agent E", value: "04:06" },
];

const agentAvgWaiting = [
  { agent: "Agent A", value: "00:18" },
  { agent: "Agent B", value: "00:22" },
  { agent: "Agent C", value: "00:25" },
  { agent: "Agent D", value: "00:29" },
  { agent: "Agent E", value: "00:34" },
];

const monthlyRatingBreakdown = [
  { month: "Jan", score1: 12, score2: 18, score3: 32, score4: 84, score5: 136 },
  { month: "Feb", score1: 10, score2: 15, score3: 28, score4: 92, score5: 144 },
  { month: "Mar", score1: 14, score2: 17, score3: 30, score4: 89, score5: 151 },
  { month: "Apr", score1: 11, score2: 13, score3: 26, score4: 97, score5: 158 },
  { month: "May", score1: 9, score2: 14, score3: 24, score4: 102, score5: 162 },
  { month: "Jun", score1: 13, score2: 16, score3: 27, score4: 95, score5: 149 },
];

const monthlyCsatScore = [
  { month: "Jan", score: 82.4 },
  { month: "Feb", score: 84.1 },
  { month: "Mar", score: 83.6 },
  { month: "Apr", score: 86.2 },
  { month: "May", score: 87.4 },
  { month: "Jun", score: 85.9 },
];

const csatCountPerAgent = [
  { agent: "Agent A", total: 50 },
  { agent: "Agent B", total: 70 },
  { agent: "Agent C", total: 80 },
  { agent: "Agent D", total: 61 },
  { agent: "Agent E", total: 44 },
];

const csatScorePerAgent = [
  { agent: "Agent A", score: 4.5 },
  { agent: "Agent B", score: 4.0 },
  { agent: "Agent C", score: 4.8 },
  { agent: "Agent D", score: 4.4 },
  { agent: "Agent E", score: 4.2 },
];

const navItems: {
  section: string;
  items: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    section: "Main",
    items: [{ key: "home", label: "Home", icon: Home }],
  },
  {
    section: "Reporting",
    items: [
      { key: "omnix", label: "OMNIX Reporting", icon: BarChart3 },
      { key: "voice", label: "Voice Monitoring", icon: Phone },
      { key: "csat", label: "CSAT Monitoring", icon: SmilePlus },
    ],
  },
  {
    section: "Data",
    items: [{ key: "upload", label: "Upload Data", icon: Upload }],
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getThemeClass(theme: ThemeMode) {
  return theme === "dark"
    ? {
        body: "bg-[#0B1220] text-[#F3F7FF]",
        appBg: "bg-[#0F172A]",
        surface: "bg-[#121A2B]/95 backdrop-blur",
        surface2: "bg-[#182235]",
        surface3: "bg-[#1D2940]",
        surfaceSoft: "bg-[#162033]",
        border: "border-[#27344D]",
        divider: "border-[#23314A]",
        text: "text-[#F3F7FF]",
        muted: "text-[#A8B6CC]",
        faint: "text-[#73839E]",
        primary: "text-[#60A5FA]",
        primaryBg: "bg-[#162A49]",
        primarySoft: "bg-[#0F2748]",
        hover: "hover:bg-[#1A2438]",
        shadow: "shadow-black/25",
        shadowSoft: "shadow-[0_10px_35px_rgba(0,0,0,0.28)]",
        ring: "ring-1 ring-white/5",
        skeleton: "bg-[#1B2639]",
        skeleton2: "bg-[#24324B]",
        chartGrid: "#22314B",
        axis: "#94A3B8",
        tooltipBg: "#162033",
        tooltipBorder: "#27344D",
      }
    : {
        body: "bg-[#F3F7FC] text-[#182235]",
        appBg: "bg-[#F6F9FD]",
        surface: "bg-white/95 backdrop-blur",
        surface2: "bg-[#F7F9FC]",
        surface3: "bg-[#EEF3F9]",
        surfaceSoft: "bg-[#F8FAFC]",
        border: "border-[#DCE4EF]",
        divider: "border-[#E7EDF5]",
        text: "text-[#182235]",
        muted: "text-[#5F708B]",
        faint: "text-[#91A0B5]",
        primary: "text-[#2563EB]",
        primaryBg: "bg-[#DBEAFE]",
        primarySoft: "bg-[#EFF6FF]",
        hover: "hover:bg-[#F3F6FA]",
        shadow: "shadow-slate-200/70",
        shadowSoft: "shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
        ring: "ring-1 ring-slate-950/[0.03]",
        skeleton: "bg-[#E8EEF6]",
        skeleton2: "bg-[#DCE5F0]",
        chartGrid: "#E5ECF5",
        axis: "#607089",
        tooltipBg: "#FFFFFF",
        tooltipBorder: "#DCE4EF",
      };
}

export default function DashboardClient() {
  const [activePage, setActivePage] = useState<NavKey>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("monthly");
  const [periodLabel, setPeriodLabel] = useState("Apr 2026");
  const [isLoading, setIsLoading] = useState(false);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);

  /* VOICE */
  const [voiceData, setVoiceData] = useState<any>(null);
  const [voiceDailyData, setVoiceDailyData] = useState<any[]>([]);
  const [voiceHourData, setVoiceHourData] = useState<any[]>([]);
  const [voiceDayData, setVoiceDayData] = useState<any[]>([]);
  const [voiceAgentData, setVoiceAgentData] = useState<any[]>([]);

  /* CSAT */
  const [csatData, setCsatData] = useState<any>(null);
  const [csatBreakdownData, setCsatBreakdownData] = useState<any[]>([]);
  const [csatMonthlyData, setCsatMonthlyData] = useState<any[]>([]);
  const [csatAgentData, setCsatAgentData] = useState<any[]>([]);

  const ui = useMemo(() => getThemeClass(theme), [theme]);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [
          summary,
          trend,
          byChannel,

          voiceSummary,
          voiceDaily,
          voiceByHour,
          voiceByDay,
          voiceByAgent,

          csatSummary,
          csatBreakdown,
          csatMonthly,
          csatByAgent,
        ] = await Promise.all([
          getDashboardSummary(),
          getDashboardTrend(),
          getDashboardByChannel(),

          getVoiceSummary(),
          getVoiceDaily(),
          getVoiceByHour(),
          getVoiceByDay(),
          getVoiceByAgent(),

          getCsatSummary(),
          getCsatRatingBreakdown(),
          getCsatMonthlyScore(),
          getCsatByAgent(),
        ]);

        setSummaryData(summary);
        setTrendData(Array.isArray(trend) ? trend : []);
        setChannelData(Array.isArray(byChannel) ? byChannel : []);

        setVoiceData(voiceSummary);
        setVoiceDailyData(Array.isArray(voiceDaily) ? voiceDaily : []);
        setVoiceHourData(Array.isArray(voiceByHour) ? voiceByHour : []);
        setVoiceDayData(Array.isArray(voiceByDay) ? voiceByDay : []);
        setVoiceAgentData(Array.isArray(voiceByAgent) ? voiceByAgent : []);

        setCsatData(csatSummary);
        setCsatBreakdownData(Array.isArray(csatBreakdown) ? csatBreakdown : []);
        setCsatMonthlyData(Array.isArray(csatMonthly) ? csatMonthly : []);
        setCsatAgentData(Array.isArray(csatByAgent) ? csatByAgent : []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [activePage, periodMode, periodLabel]);

  const pageMeta = useMemo(() => {
    switch (activePage) {
      case "home":
        return {
          title: "Home",
          subtitle: "Ticket Interactions, Case Trends, SLA Monitoring",
        };
      case "omnix":
        return {
          title: "OMNIX Reporting",
          subtitle: "Ticket Interactions, Case Trends, SLA Monitoring",
        };
      case "voice":
        return {
          title: "Voice Monitoring",
          subtitle: "Call Interactions & SLA Monitoring",
        };
      case "csat":
        return {
          title: "CSAT Monitoring",
          subtitle: "CSAT Monitoring & SLA Monitoring",
        };
      case "upload":
        return {
          title: "Upload Data",
          subtitle: "Manage file uploads for OMNIX, Voice, and CSAT sources",
        };
    }
  }, [activePage]);

  return (
    <div className={cn("min-h-screen w-full font-[Inter,ui-sans-serif,system-ui,sans-serif]", ui.body)}>
      <div className={cn("flex h-screen overflow-hidden", ui.appBg)}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex border-r transition-all duration-300",
            ui.surface,
            ui.border,
            ui.ring,
            ui.shadowSoft,
            sidebarCollapsed ? "w-24" : "w-[296px]"
          )}
        >
          <div className="flex w-full flex-col">
            <div className={cn("flex h-[96px] items-center gap-4 border-b px-6", ui.border)}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 shadow-sm">
                <LayoutDashboard className="h-6 w-6 text-[#3B82F6]" />
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
                    Reporting Dashboard
                  </div>
                  <div className={cn("mt-1 truncate text-[18px] font-bold tracking-tight", ui.text)}>OMNIX</div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              {navItems.map((group, index) => (
                <div key={group.section}>
                  {index === 2 && <div className={cn("my-6 border-t", ui.divider)} />}
                  <NavGroup
                    title={group.section}
                    collapsed={sidebarCollapsed}
                    items={group.items}
                    activePage={activePage}
                    setActivePage={setActivePage}
                    ui={ui}
                  />
                </div>
              ))}
            </div>

            <div className={cn("border-t p-4", ui.border)}>
              <button
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-semibold transition-all duration-200",
                  ui.muted,
                  ui.hover
                )}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5 shrink-0" />
                ) : (
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                )}
                {!sidebarCollapsed && <span>Collapse Sidebar</span>}
              </button>
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "flex h-screen flex-1 flex-col transition-all duration-300",
            sidebarCollapsed ? "ml-24" : "ml-[296px]"
          )}
        >
          <header
            className={cn(
              "flex min-h-[110px] shrink-0 items-center justify-between border-b px-8 py-6",
              ui.surface,
              ui.border,
              ui.ring
            )}
          >
            <div>
              <div className={cn("text-[13px] font-medium tracking-wide", ui.faint)}>
                Dashboard / {pageMeta.title}
              </div>

              <div className="mt-2 text-[34px] font-bold tracking-tight">{pageMeta.title}</div>

              <div className={cn("mt-2 text-[14px]", ui.muted)}>{pageMeta.subtitle}</div>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn("flex items-center gap-1 rounded-xl border p-1", ui.surface3, ui.border)}>
                <button
                  onClick={() => {
                    setPeriodMode("monthly");
                    setPeriodLabel("Apr 2026");
                  }}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[13px] font-medium transition",
                    periodMode === "monthly" ? "bg-[#3B82F6] text-white" : cn(ui.muted, "hover:bg-white/5")
                  )}
                >
                  Monthly
                </button>

                <button
                  onClick={() => {
                    setPeriodMode("quarterly");
                    setPeriodLabel("Q2 2026");
                  }}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[13px] font-medium transition",
                    periodMode === "quarterly" ? "bg-[#3B82F6] text-white" : cn(ui.muted, "hover:bg-white/5")
                  )}
                >
                  Quarterly
                </button>

                <button
                  onClick={() => {
                    setPeriodMode("yearly");
                    setPeriodLabel("2026");
                  }}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[13px] font-medium transition",
                    periodMode === "yearly" ? "bg-[#3B82F6] text-white" : cn(ui.muted, "hover:bg-white/5")
                  )}
                >
                  Yearly
                </button>
              </div>

              <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5", ui.surface3, ui.border)}>
                <CalendarDays className={cn("h-4 w-4", ui.muted)} />
                <select
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  className={cn("bg-transparent text-[13px] font-medium outline-none", ui.muted)}
                >
                  {periodMode === "monthly" && (
                    <>
                      <option>Apr 2026</option>
                      <option>Mar 2026</option>
                      <option>Feb 2026</option>
                      <option>Jan 2026</option>
                    </>
                  )}

                  {periodMode === "quarterly" && (
                    <>
                      <option>Q2 2026</option>
                      <option>Q1 2026</option>
                      <option>Q4 2025</option>
                      <option>Q3 2025</option>
                    </>
                  )}

                  {periodMode === "yearly" && (
                    <>
                      <option>2026</option>
                      <option>2025</option>
                      <option>2024</option>
                    </>
                  )}
                </select>
              </div>

              <button
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                className={cn("rounded-xl border p-2.5", ui.surface3, ui.border)}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B82F6] text-[13px] font-semibold text-white">
                SA
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
            {isLoading ? (
              <DashboardSkeleton ui={ui} />
            ) : (
              <>
                {activePage === "home" && (
                  <HomePage
                    ui={ui}
                    summaryData={summaryData}
                    trendData={trendData}
                    channelData={channelData}
                  />
                )}
                {activePage === "omnix" && <OmnixPage ui={ui} />}
                {activePage === "voice" && (
                  <VoicePage
                    ui={ui}
                    voiceData={voiceData}
                    voiceDailyData={voiceDailyData}
                    voiceHourData={voiceHourData}
                    voiceDayData={voiceDayData}
                    voiceAgentData={voiceAgentData}
                  />
                )}
                {activePage === "csat" && (
                  <CsatPage
                    ui={ui}
                    csatData={csatData}
                    csatBreakdownData={csatBreakdownData}
                    csatMonthlyData={csatMonthlyData}
                    csatAgentData={csatAgentData}
                  />
                )}
                {activePage === "upload" && <UploadPage ui={ui} />}
              </>
            )}
          </main>

          <footer
            className={cn(
              "flex h-[64px] shrink-0 items-center justify-between border-t px-8",
              ui.surface,
              ui.border,
              ui.ring
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className={cn("text-[13px] font-semibold", ui.text)}>Reporting Dashboard OMNIX</span>
              <span className={cn("text-[12px]", ui.faint)}>Operational dashboard environment</span>
            </div>
            <div className={cn("text-[12px] font-medium", ui.muted)}>@saisoku.id 2026</div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  collapsed,
  items,
  activePage,
  setActivePage,
  ui,
}: {
  title: string;
  collapsed: boolean;
  items: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }> }[];
  activePage: NavKey;
  setActivePage: (value: NavKey) => void;
  ui: ReturnType<typeof getThemeClass>;
}) {
  return (
    <div className="mb-7">
      {!collapsed && (
        <div className={cn("px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70", ui.faint)}>
          {title}
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const active = activePage === item.key;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={cn(
                "flex w-full items-center rounded-xl px-4 py-3 text-left text-[14px] font-medium transition-all duration-200",
                active
                  ? "border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6]"
                  : cn(ui.text, "hover:bg-white/5"),
                collapsed ? "justify-center" : "justify-start gap-3"
              )}
              title={item.label}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HomePage({
  ui,
  summaryData,
  trendData,
  channelData,
}: {
  ui: ReturnType<typeof getThemeClass>;
  summaryData: any;
  trendData: any[];
  channelData: any[];
}) {
  const homeChartData =
    trendData?.length > 0
      ? trendData.map((item) => ({
          label: item.month || item.label || "-",
          total: (item.voice || 0) + (item.omnix || 0) + (item.csat || 0),
        }))
      : [];

  return (
    <div className="space-y-8">
      <SectionTitle title="KPI Utama" ui={ui} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        <CompactKpiCard
          title="Total Voice"
          value={String(summaryData?.total_voice_interactions ?? 0)}
          subtitle="Total voice interactions"
          tone="blue"
          ui={ui}
        />
        <CompactKpiCard
          title="Total Omnix"
          value={String(summaryData?.total_omnix_cases ?? 0)}
          subtitle="Total omnix cases"
          tone="violet"
          ui={ui}
        />
        <CompactKpiCard
          title="Total CSAT"
          value={String(summaryData?.total_csat_responses ?? 0)}
          subtitle="Total CSAT responses"
          tone="green"
          ui={ui}
        />
        <CompactKpiCard title="AWT" value="0:24" subtitle="Average waiting" tone="amber" ui={ui} />
        <CompactKpiCard
          title="Average CSAT"
          value={String(summaryData?.average_csat ?? 0)}
          subtitle="Average CSAT score"
          tone="green"
          ui={ui}
        />
      </div>

      <SectionTitle title="Tabel Meta" ui={ui} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <CompactMiniTable
          title="Summary by Channel"
          headers={["Channel", "Total"]}
          rows={(channelData?.length > 0 ? channelData : []).map((item) => [
            <div key={item.channel} className="flex items-center gap-3">
              <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold", ui.primaryBg, ui.primary)}>
                {String(item.channel || "UN").slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate">{item.channel}</span>
            </div>,
            formatNumber(Number(item.total || 0)),
          ])}
          ui={ui}
        />

        <CompactMiniTable
          title="Summary by Category"
          headers={["Category", "Total"]}
          rows={homeSummaryByCategory.map((item) => [item.category, formatNumber(item.total)])}
          ui={ui}
        />

        <CompactMiniTable
          title="Summary by Product"
          headers={["Product", "Total"]}
          rows={homeSummaryByProduct.map((item) => [item.product, formatNumber(item.total)])}
          ui={ui}
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <SectionTitle title="Chart Interaction" ui={ui} />
          <Card ui={ui} className="mt-4 p-7">
            <CardHeader title="Daily / Monthly Interaction" subtitle="Data from backend trend" ui={ui} compact />
            <div className="h-[340px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={homeChartData}>
                  <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                  <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                  <Bar dataKey="total" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <SectionTitle title="Summary Customer" ui={ui} />
          <div className="mt-4 grid grid-cols-1 gap-5">
            <Card ui={ui} className="p-7">
              <div className={cn("text-[12px] font-semibold uppercase tracking-[0.12em]", ui.muted)}>Customer by Month</div>
              <div className="mt-4 text-[34px] font-bold leading-none tracking-tight">1,616</div>
              <div className={cn("mt-3 text-[13px] leading-6", ui.muted)}>
                Jumlah customer yang menghubungi OMNIX dilihat dari no hp / nama user IG / email di bulan sesuai filter.
              </div>
            </Card>

            <Card ui={ui} className="p-7">
              <div className={cn("text-[12px] font-semibold uppercase tracking-[0.12em]", ui.muted)}>New Customer by Month</div>
              <div className="mt-4 text-[34px] font-bold leading-none tracking-tight">1,431</div>
              <div className={cn("mt-3 text-[13px] leading-6", ui.muted)}>
                Jumlah customer baru dilihat dari no hp / nama user IG / email apakah sudah pernah masuk OMNIX.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OmnixPage({ ui }: { ui: ReturnType<typeof getThemeClass> }) {
  return (
    <div className="space-y-8">
      <SectionTitle title="KPI Utama" ui={ui} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <CompactKpiCard title="Total Ticket" value="12,378" subtitle="Total ticket" tone="blue" ui={ui} />
        <CompactKpiCard title="AHT" value="04:12" subtitle="Average handling" tone="violet" ui={ui} />
        <CompactKpiCard title="ART" value="01:08" subtitle="Average response" tone="green" ui={ui} />
        <CompactKpiCard title="AWT" value="00:31" subtitle="Average waiting" tone="amber" ui={ui} />
      </div>

      <SectionTitle title="Tabel Meta" ui={ui} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <CompactMiniTable
          title="Summary by Channel"
          headers={["Channel", "Ticket"]}
          rows={omnixSummaryByChannel.map((item) => [
            <div key={item.channel} className="flex items-center gap-3">
              <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold", ui.primaryBg, ui.primary)}>
                {item.icon}
              </span>
              <span className="truncate">{item.channel}</span>
            </div>,
            formatNumber(item.total),
          ])}
          ui={ui}
        />

        <CompactMiniTable
          title="Summary by Category"
          headers={["Category", "Ticket"]}
          rows={omnixSummaryByCategory.map((item) => [item.category, formatNumber(item.total)])}
          ui={ui}
        />

        <CompactMiniTable
          title="Summary by Product"
          headers={["Product", "Ticket"]}
          rows={omnixSummaryByProduct.map((item) => [item.product, formatNumber(item.total)])}
          ui={ui}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card ui={ui} className="xl:col-span-7 p-7">
          <CardHeader title="Daily Chat" subtitle="1 - 30 / 31" ui={ui} compact />
          <div className="h-[340px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={omnixDailyChatData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card ui={ui} className="xl:col-span-5 p-7">
          <CardHeader title="By Hour" subtitle="00:00 - 24:00" ui={ui} compact />
          <div className="h-[320px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={omnixByHourData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Bar dataKey="total" fill="#22C55E" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card ui={ui} className="xl:col-span-4 p-7">
          <CardHeader title="By Day" subtitle="Senin - Minggu" ui={ui} compact />
          <div className="h-[300px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={omnixByDayData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Bar dataKey="total" fill="#F59E0B" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <CompactCaseCard title="Informasi" data={omnixCaseInformasi} color="#2563EB" ui={ui} />
        <CompactCaseCard title="Panduan" data={omnixCasePanduan} color="#16A34A" ui={ui} />
        <CompactCaseCard title="Other" data={omnixCaseOther} color="#F97316" ui={ui} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {omnixCustomerSummary.map((item) => (
          <Card key={item.title} ui={ui} className="p-7">
            <div className={cn("text-[12px] font-semibold uppercase tracking-[0.12em]", ui.muted)}>{item.title}</div>
            <div className="mt-4 text-[34px] font-bold leading-none tracking-tight">{item.value}</div>
            <div className={cn("mt-3 text-[13px] leading-6", ui.muted)}>{item.note}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VoicePage({
  ui,
  voiceData,
  voiceDailyData,
  voiceHourData,
  voiceDayData,
  voiceAgentData,
}: {
  ui: ReturnType<typeof getThemeClass>;
  voiceData: any;
  voiceDailyData: any[];
  voiceHourData: any[];
  voiceDayData: any[];
  voiceAgentData: any[];
}) {
  const dailyData =
    voiceDailyData?.length > 0
      ? voiceDailyData.map((item) => ({
          label: item.label || item.day || item.date || "-",
          total: Number(item.total || 0),
        }))
      : voiceDailyCallData;

  const hourData =
    voiceHourData?.length > 0
      ? voiceHourData.map((item) => ({
          label: item.label || item.hour || "-",
          total: Number(item.total || 0),
        }))
      : voiceByHourData;

  const dayData =
    voiceDayData?.length > 0
      ? voiceDayData.map((item) => ({
          label: item.label || item.day || "-",
          total: Number(item.total || 0),
        }))
      : voiceByDayData;

  const agentHandlingRows =
    voiceAgentData?.length > 0
      ? voiceAgentData.map((item) => [
          item.agent || "-",
          formatNumber(Number(item.total_calls || item.total || 0)),
        ])
      : agentCallHandling.map((item) => [item.agent, formatNumber(item.total)]);

  const agentAhtRows =
    voiceAgentData?.length > 0
      ? voiceAgentData.map((item) => [
          item.agent || "-",
          item.avg_handling_time || item.aht || "-",
        ])
      : agentAvgHandling.map((item) => [item.agent, item.value]);

  const agentAwtRows =
    voiceAgentData?.length > 0
      ? voiceAgentData.map((item) => [
          item.agent || "-",
          item.avg_waiting_time || item.awt || "-",
        ])
      : agentAvgWaiting.map((item) => [item.agent, item.value]);

  return (
    <div className="space-y-8">
      <SectionTitle title="KPI Monitoring" ui={ui} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <CompactKpiCard
          title="Total Calls"
          value={String(voiceData?.total_voice_interactions ?? 0)}
          subtitle="Total panggilan"
          tone="blue"
          ui={ui}
        />
        <CompactKpiCard
          title="Answered"
          value={String(voiceData?.answered_calls ?? 0)}
          subtitle="Berhasil dijawab"
          tone="green"
          ui={ui}
        />
        <CompactKpiCard
          title="Abandon"
          value={String(voiceData?.abandoned_calls ?? 0)}
          subtitle="Tidak terjawab"
          tone="amber"
          ui={ui}
        />
        <CompactKpiCard
          title="AVG Handling"
          value={String(voiceData?.avg_handling_time ?? "00:00")}
          subtitle="Handling time"
          tone="violet"
          ui={ui}
        />
        <CompactKpiCard
          title="AVG Waiting"
          value={String(voiceData?.avg_waiting_time ?? "00:00")}
          subtitle="Waiting time"
          tone="amber"
          ui={ui}
        />
        <CompactKpiCard
          title="SCR"
          value={String(voiceData?.success_rate ?? "0") + "%"}
          subtitle="Success rate"
          tone="green"
          ui={ui}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card ui={ui} className="xl:col-span-6 p-7">
          <CardHeader title="Daily Call" subtitle="Data backend" ui={ui} compact />
          <div className="h-[340px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Bar dataKey="total" fill="#3B82F6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card ui={ui} className="xl:col-span-3 p-7">
          <CardHeader title="Call by Hour" subtitle="Data backend" ui={ui} compact />
          <div className="h-[300px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Bar dataKey="total" fill="#22C55E" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card ui={ui} className="xl:col-span-3 p-7">
          <CardHeader title="Call by Day" subtitle="Data backend" ui={ui} compact />
          <div className="h-[300px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Bar dataKey="total" fill="#F59E0B" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <CompactMiniTable
          title="Call Handling per Agent"
          headers={["Agent", "Total"]}
          rows={agentHandlingRows}
          ui={ui}
        />
        <CompactMiniTable
          title="AVG Handling Time"
          headers={["Agent", "Time"]}
          rows={agentAhtRows}
          ui={ui}
        />
        <CompactMiniTable
          title="AVG Waiting Time"
          headers={["Agent", "Time"]}
          rows={agentAwtRows}
          ui={ui}
        />
      </div>
    </div>
  );
}

function CsatPage({
  ui,
  csatData,
  csatBreakdownData,
  csatMonthlyData,
  csatAgentData,
}: {
  ui: ReturnType<typeof getThemeClass>;
  csatData: any;
  csatBreakdownData: any[];
  csatMonthlyData: any[];
  csatAgentData: any[];
}) {
  const ratingData =
    csatBreakdownData?.length > 0
      ? csatBreakdownData.map((item) => ({
          month: item.month || "-",
          score1: Number(item.score1 || 0),
          score2: Number(item.score2 || 0),
          score3: Number(item.score3 || 0),
          score4: Number(item.score4 || 0),
          score5: Number(item.score5 || 0),
        }))
      : monthlyRatingBreakdown;

  const monthlyScoreData =
    csatMonthlyData?.length > 0
      ? csatMonthlyData.map((item) => ({
          month: item.month || "-",
          score: Number(item.score || item.csat || 0),
        }))
      : monthlyCsatScore;

  const countRows =
    csatAgentData?.length > 0
      ? csatAgentData.map((item) => [
          item.agent || "-",
          formatNumber(Number(item.total_response || item.total || 0)),
        ])
      : csatCountPerAgent.map((item) => [item.agent, formatNumber(item.total)]);

  const scoreRows =
    csatAgentData?.length > 0
      ? csatAgentData.map((item) => [
          item.agent || "-",
          String(item.score ?? item.csat_score ?? 0),
        ])
      : csatScorePerAgent.map((item) => [item.agent, item.score.toFixed(1)]);

  return (
    <div className="space-y-8">
      <SectionTitle title="KPI Monitoring" ui={ui} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <CompactKpiCard
          title="Total Response"
          value={String(csatData?.total_csat_responses ?? 0)}
          subtitle="Total survey"
          tone="blue"
          ui={ui}
        />
        <CompactKpiCard
          title="High Score"
          value={String(csatData?.high_score ?? 0)}
          subtitle="Rating 4 dan 5"
          tone="green"
          ui={ui}
        />
        <CompactKpiCard
          title="Low Score"
          value={String(csatData?.low_score ?? 0)}
          subtitle="Rating 1 sampai 3"
          tone="amber"
          ui={ui}
        />
        <CompactKpiCard
          title="CSAT Score"
          value={String(csatData?.average_csat ?? 0) + "%"}
          subtitle="Customer satisfaction"
          tone="violet"
          ui={ui}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card ui={ui} className="xl:col-span-7 p-7">
          <CardHeader title="Monthly Rating Breakdown" subtitle="Distribusi rating 1 - 5 per bulan" ui={ui} compact />
          <div className="h-[340px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Bar dataKey="score1" stackId="a" fill="#EF4444" />
                <Bar dataKey="score2" stackId="a" fill="#F97316" />
                <Bar dataKey="score3" stackId="a" fill="#FACC15" />
                <Bar dataKey="score4" stackId="a" fill="#22C55E" />
                <Bar dataKey="score5" stackId="a" fill="#16A34A" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card ui={ui} className="xl:col-span-5 p-7">
          <CardHeader title="Monthly CSAT Score" subtitle="Persentase kepuasan bulanan" ui={ui} compact />
          <div className="h-[320px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyScoreData}>
                <CartesianGrid stroke={ui.chartGrid} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} />
                <YAxis stroke={ui.axis} tick={{ fill: ui.axis, fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 18 }} />
                <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3, fill: "#3B82F6" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <CompactMiniTable
          title="Jumlah CSAT per Agent"
          headers={["Agent", "Total"]}
          rows={countRows}
          ui={ui}
        />
        <CompactMiniTable
          title="Nilai CSAT per Agent"
          headers={["Agent", "Score"]}
          rows={scoreRows}
          ui={ui}
        />
      </div>
    </div>
  );
}

function UploadPage({ ui }: { ui: ReturnType<typeof getThemeClass> }) {
  return (
    <div className="space-y-8">
      <SectionTitle title="Upload Data" ui={ui} />
      <Card ui={ui} className="p-7">
        <CardHeader title="UPLOAD DATA" subtitle="Manage file uploads for OMNIX, Voice, and CSAT sources" ui={ui} compact />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className={cn("mb-2.5 block text-[12px] font-semibold uppercase tracking-[0.08em]", ui.muted)}>
              Type Data
            </label>
            <select className={cn("w-full rounded-2xl border px-4 py-3.5 text-[14px] font-medium outline-none", ui.surface3, ui.border)}>
              <option>OMNIX</option>
              <option>VOICE</option>
              <option>CSAT</option>
            </select>
          </div>

          <div>
            <label className={cn("mb-2.5 block text-[12px] font-semibold uppercase tracking-[0.08em]", ui.muted)}>
              Select File
            </label>
            <button className={cn("flex w-full items-center gap-2 rounded-2xl border px-4 py-3.5 text-left text-[14px] font-medium", ui.surface3, ui.border, ui.muted)}>
              <FileUp className="h-4 w-4" />
              Klik open file management
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-3.5 text-[14px] font-semibold text-white shadow-sm transition hover:scale-[1.01]">
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-[14px] font-semibold text-white shadow-sm transition hover:scale-[1.01]">
              <Database className="h-4 w-4" />
              Proses
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-600 px-5 py-3.5 text-[14px] font-semibold text-white shadow-sm transition hover:scale-[1.01]">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </Card>

      <CompactMiniTable
        title="Recent Upload History"
        headers={["Date", "Type", "Filename", "Status", "Uploader"]}
        rows={[
          ["2026-04-07 13:20", "OMNIX", "omnix_apr_w1.xlsx", "Processed", "Admin"],
          ["2026-04-07 11:48", "VOICE", "voice_apr_w1.csv", "Uploaded", "Admin"],
          ["2026-04-07 09:32", "CSAT", "csat_apr_w1.xlsx", "Processed", "Admin"],
        ]}
        ui={ui}
      />
    </div>
  );
}

function CompactCaseCard({
  title,
  data,
  color,
  ui,
}: {
  title: string;
  data: { name: string; total: number }[];
  color: string;
  ui: ReturnType<typeof getThemeClass>;
}) {
  return (
    <Card ui={ui} className="xl:col-span-4 p-7">
      <CardHeader title={title} subtitle="Top 5 case" ui={ui} compact />

      <div className="space-y-3.5">
        {data.slice(0, 5).map((item, index) => (
          <div
            key={`${title}-${index}`}
            className={cn(
              "rounded-[22px] border px-5 py-4 transition-all duration-200 hover:-translate-y-[1px]",
              ui.surface2,
              ui.border
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold leading-6">{item.name}</div>
              </div>

              <div className="shrink-0 text-[15px] font-bold" style={{ color }}>
                {formatNumber(item.total)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SectionTitle({ title, ui }: { title: string; ui: ReturnType<typeof getThemeClass> }) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn("text-[14px] font-semibold uppercase tracking-[0.16em]", ui.faint)}>{title}</div>
      <div className={cn("h-px flex-1", ui.surface3)} />
    </div>
  );
}

function Card({
  children,
  ui,
  className,
}: {
  children: React.ReactNode;
  ui: ReturnType<typeof getThemeClass>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[30px] border p-7 shadow-xl transition-all duration-300 hover:-translate-y-[1px]",
        ui.surface,
        ui.border,
        ui.ring,
        ui.shadowSoft,
        className
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  subtitle,
  ui,
  compact,
}: {
  title: string;
  subtitle?: string;
  ui: ReturnType<typeof getThemeClass>;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-6" : "mb-7"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={cn(compact ? "text-[19px] font-bold tracking-tight" : "text-[21px] font-bold tracking-tight")}>
            {title}
          </div>

          {subtitle && (
            <div className={cn(compact ? "mt-2 text-[13px] leading-6" : "mt-2.5 text-[14px] leading-6", ui.muted)}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactKpiCard({
  title,
  value,
  subtitle,
  tone,
  ui,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "blue" | "green" | "amber" | "violet";
  ui: ReturnType<typeof getThemeClass>;
}) {
  const toneMap = {
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400",
    green: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
  };

  return (
    <Card ui={ui} className="p-6">
      <div className={cn("inline-flex rounded-2xl bg-gradient-to-br px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]", toneMap[tone])}>
        {title}
      </div>
      <div className="mt-5 text-[32px] font-bold leading-none tracking-tight">{value}</div>
      <div className={cn("mt-3 text-[13px]", ui.muted)}>{subtitle}</div>
    </Card>
  );
}

function CompactMiniTable({
  title,
  headers,
  rows,
  ui,
}: {
  title: string;
  headers: string[];
  rows: any[][];
  ui: ReturnType<typeof getThemeClass>;
}) {
  return (
    <Card ui={ui} className="p-7">
      <CardHeader title={title} ui={ui} compact />
      <div className="overflow-hidden rounded-2xl border">
        <table className="w-full text-left text-[14px]">
          <thead className={cn(ui.surface3, ui.border)}>
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={cn("border-t", ui.border)}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DashboardSkeleton({ ui }: { ui: ReturnType<typeof getThemeClass> }) {
  return (
    <div className="space-y-8">
      <div className={cn("h-6 w-40 rounded-xl", ui.skeleton)} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("h-36 rounded-[30px]", ui.skeleton)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className={cn("h-[360px] rounded-[30px]", ui.skeleton)} />
        <div className={cn("h-[360px] rounded-[30px]", ui.skeleton)} />
      </div>
    </div>
  );
}