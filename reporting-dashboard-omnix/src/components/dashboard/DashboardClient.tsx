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

/* 🔥 NO DUMMY DATA */
const homeSummaryByCategory: any[] = [];
const homeSummaryByProduct: any[] = [];

const omnixSummaryByChannel: any[] = [];
const omnixSummaryByCategory: any[] = [];
const omnixSummaryByProduct: any[] = [];

const omnixDailyChatData: any[] = [];
const omnixByHourData: any[] = [];
const omnixByDayData: any[] = [];

const omnixCaseInformasi: any[] = [];
const omnixCasePanduan: any[] = [];
const omnixCaseOther: any[] = [];

const omnixCustomerSummary: any[] = [];

const voiceDailyCallData: any[] = [];
const voiceByHourData: any[] = [];
const voiceByDayData: any[] = [];

const agentCallHandling: any[] = [];
const agentAvgHandling: any[] = [];
const agentAvgWaiting: any[] = [];

const monthlyRatingBreakdown: any[] = [];
const monthlyCsatScore: any[] = [];

const csatCountPerAgent: any[] = [];
const csatScorePerAgent: any[] = [];

/* ============================= */

const navItems = [
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function DashboardClient() {
  const [activePage, setActivePage] = useState<NavKey>("home");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const [summaryData, setSummaryData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);

  const [voiceData, setVoiceData] = useState<any>(null);
  const [voiceDailyData, setVoiceDailyData] = useState<any[]>([]);
  const [voiceHourData, setVoiceHourData] = useState<any[]>([]);
  const [voiceDayData, setVoiceDayData] = useState<any[]>([]);
  const [voiceAgentData, setVoiceAgentData] = useState<any[]>([]);

  const [csatData, setCsatData] = useState<any>(null);
  const [csatBreakdownData, setCsatBreakdownData] = useState<any[]>([]);
  const [csatMonthlyData, setCsatMonthlyData] = useState<any[]>([]);
  const [csatAgentData, setCsatAgentData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [
        summary,
        trend,
        channel,
        voice,
        vDaily,
        vHour,
        vDay,
        vAgent,
        csat,
        csatBreak,
        csatMonth,
        csatAgent,
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
      setTrendData(trend || []);
      setChannelData(channel || []);

      setVoiceData(voice);
      setVoiceDailyData(vDaily || []);
      setVoiceHourData(vHour || []);
      setVoiceDayData(vDay || []);
      setVoiceAgentData(vAgent || []);

      setCsatData(csat);
      setCsatBreakdownData(csatBreak || []);
      setCsatMonthlyData(csatMonth || []);
      setCsatAgentData(csatAgent || []);
    };

    load();
  }, []);

  /* 🔥 NO FALLBACK DUMMY */
  const dailyData = (voiceDailyData || []).map((item) => ({
    label: item.label || item.day || "-",
    total: Number(item.total || 0),
  }));

  const ratingData = (csatBreakdownData || []).map((item) => ({
    month: item.month || "-",
    score1: Number(item.score1 || 0),
    score2: Number(item.score2 || 0),
    score3: Number(item.score3 || 0),
    score4: Number(item.score4 || 0),
    score5: Number(item.score5 || 0),
  }));

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Dashboard Clean Mode 🚀</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl">
          Voice: {summaryData?.total_voice_interactions || 0}
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          Omnix: {summaryData?.total_omnix_cases || 0}
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          CSAT: {summaryData?.total_csat_responses || 0}
        </div>
      </div>

      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}