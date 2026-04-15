"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Ticket,
  Star,
  Activity,
  Users,
  UserPlus,
  RefreshCcw,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDashboardSummary,
  getDashboardTrend,
  getDashboardByChannel,
} from "@/lib/api";

export default function HomePage() {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default ke April karena datamu ada di April
  const [mode, setMode] = useState("monthly");
  const [period, setPeriod] = useState("Apr");
  const [year, setYear] = useState(2026);
  const [dark, setDark] = useState(true);

  const monthOptions = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const quarterOptions = ["Q1", "Q2", "Q3", "Q4"];
  const yearOptions = ["2023","2024","2025","2026"];

  useEffect(() => {
    if (mode === "monthly" && !monthOptions.includes(period)) setPeriod("Jan");
    if (mode === "quarter" && !quarterOptions.includes(period)) setPeriod("Q1");
    if (mode === "yearly") setPeriod("");
  }, [mode]);

  const initDashboard = async () => {
    setLoading(true);
    try {
      const params = {
        mode,
        period: mode === "yearly" ? "" : period,
        year,
      };

      console.log("📡 Mengirim Request dengan Params:", params);

      const [s, t, c] = await Promise.all([
        getDashboardSummary(params),
        getDashboardTrend(params),
        getDashboardByChannel(params),
      ]);

      console.log("✅ Data Summary Diterima:", s);
      console.log("✅ Data Trend Diterima:", t);

      // Set state hanya jika data tidak null
      if (s) setSummary(s);
      if (t) setTrend(Array.isArray(t) ? t : []);
      if (c) setChannels(Array.isArray(c) ? c : []);

    } catch (err) {
      console.error("❌ Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initDashboard();
  }, [mode, period, year]);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (dark) html.classList.remove("dark");
    else html.classList.add("dark");
    setDark(!dark);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-cyan-400 animate-spin w-10 h-10 mx-auto mb-4" />
          <p className="text-xs text-slate-500 animate-pulse">Syncing with Supabase...</p>
        </div>
      </div>
    );
  }

  const safeTrend = Array.isArray(trend) ? trend : [];
  const max = Math.max(...safeTrend.map((t: any) => t.count || 0), 1);

  const kpis = [
    {
      label: "Total Ticket",
      value: summary?.total_omnix_cases ?? 0,
      icon: Ticket,
      color: "text-blue-400",
    },
    {
      label: "Voice Interaction",
      value: summary?.total_voice_interactions ?? 0,
      icon: Activity,
      color: "text-cyan-400",
    },
    {
      label: "CSAT Response",
      value: summary?.total_csat_responses ?? 0,
      icon: Users,
      color: "text-emerald-400",
    },
    {
      label: "CSAT Score",
      value: summary?.average_csat ?? 0,
      icon: Star,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-200 p-6 flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
        <div>
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Overview</h2>
          <h1 className="text-xl font-bold text-white">
            Global Unified Monitoring <span className="text-cyan-400">Dashboard</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <select value={mode} onChange={(e) => setMode(e.target.value)}
            className="bg-[#161F30] text-white border border-white/10 px-3 py-1.5 rounded text-xs outline-none">
            <option value="monthly">Monthly</option>
            <option value="quarter">Quarter</option>
            <option value="yearly">Yearly</option>
          </select>

          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="bg-[#161F30] text-white border border-white/10 px-3 py-1.5 rounded text-xs outline-none">
            {mode === "monthly" && monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            {mode === "quarter" && quarterOptions.map((q) => <option key={q} value={q}>{q}</option>)}
            {mode === "yearly" && yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="bg-[#161F30] text-white border border-white/10 px-3 py-1.5 rounded text-xs outline-none">
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <button onClick={initDashboard}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-400 hover:bg-cyan-500/20 transition-all">
            <RefreshCcw size={14} /> Sync
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={kpi.label}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all">
            <div className={cn("p-2 w-fit rounded-lg bg-[#0B1220] border border-white/5 mb-3", kpi.color)}>
              <kpi.icon size={16} />
            </div>
            <p className="text-[10px] text-slate-500 uppercase mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-white tracking-tight">
                {typeof kpi.value === 'number' && kpi.label !== "CSAT Score" ? kpi.value.toLocaleString() : kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-8 rounded-xl bg-white/[0.03] border border-white/10 p-5 h-[280px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interaction Trend</h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Live Data</span>
          </div>
          <div className="flex-1 flex items-end gap-[4px] pt-4">
            {safeTrend.length > 0 ? safeTrend.map((t: any, i: number) => (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${(t.count / max) * 100}%` }}
                key={i}
                className="flex-1 bg-gradient-to-t from-cyan-600/40 to-cyan-400/60 rounded-t-sm group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                   {t.date}: {t.count}
                </div>
              </motion.div>
            )) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs italic">
                    No trend data available for this period
                </div>
            )}
          </div>
        </div>

        <div className="col-span-4 flex flex-col gap-4">
          <CardStat icon={Users} label="Total Ticket System" value={summary?.total_omnix_cases ?? 0} />
          <CardStat icon={UserPlus} label="Total Voice System" value={summary?.total_voice_interactions ?? 0} />
          <div className="flex-1 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 p-4 flex flex-col justify-center">
             <p className="text-[10px] text-cyan-400 uppercase font-bold mb-1">Status System</p>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs text-white font-medium">Database Connected</span>
             </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TABLES */}
      <div className="grid grid-cols-4 gap-4">
        <CompactTable title="Channel Distribution" data={channels} />
        <CompactTable title="Category Metrics" data={[]} />
        <CompactTable title="Top Products" data={[]} />
        <CompactTable title="System Nodes" data={[{ name: "Supabase DB", count: "ACTIVE" }, { name: "FastAPI", count: "v1.0.0" }]} />
      </div>
    </div>
  );
}

function CardStat({ icon: Icon, label, value }: any) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-4 hover:bg-white/[0.05] transition-all">
      <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase font-semibold">{label}</p>
        <p className="text-xl font-bold text-white">{value?.toLocaleString()}</p>
      </div>
    </div>
  );
}

function CompactTable({ title, data }: any) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
      <h5 className="text-[10px] text-cyan-400 font-bold uppercase mb-3 tracking-widest border-b border-white/5 pb-2">{title}</h5>
      <div className="space-y-2">
        {data.length > 0 ? data.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-[11px] group">
              <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{item.name || item.label}</span>
              <span className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded">{item.count ?? item.value}</span>
            </div>
          )) : (
            <p className="text-[10px] text-slate-600 italic">No data</p>
          )}
      </div>
    </div>
  );
}