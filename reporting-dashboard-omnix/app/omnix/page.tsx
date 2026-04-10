"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary, getDashboardByChannel, getDashboardTrend } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function OmnixPage() {
  const [summary, setSummary] = useState<any>(null);
  const [channel, setChannel] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, c, t] = await Promise.all([
        getDashboardSummary(),
        getDashboardByChannel(),
        getDashboardTrend(),
      ]);
      setSummary(s);
      setChannel(c || []);
      setTrend(t || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-10 text-white">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e2e8f4] p-6 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="text-xs text-gray-500 mb-1">OMNIX › <span className="text-blue-400">Reporting</span></nav>
          <h1 className="text-2xl font-bold">OMNIX Reporting</h1>
          <p className="text-sm text-gray-400 font-medium">Ticket Interactions, Case Trends, SLA Monitoring</p>
        </div>
        <div className="bg-[#1c2333] border border-[#2f3a52] px-4 py-2 rounded-md text-xs text-gray-300">
          Apr 2026
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Total Ticket" value={summary?.total_omnix_cases || 0} color="border-blue-500" />
        <KpiCard title="AHT" value="-" color="border-green-500" />
        <KpiCard title="ART" value="-" color="border-orange-500" />
        <KpiCard title="AWT" value="-" color="border-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABLE CHANNEL */}
        <div className="lg:col-span-1 bg-[#161b27] border border-[#2f3a52] rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            Summary by Channel
          </h3>
          <div className="space-y-4">
            {channel.map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold capitalize">{item.channel}</span>
                  <div className="w-32 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${(item.total/summary?.total_omnix_cases)*100}%` }}></div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-300">{item.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHART TREND */}
        <div className="lg:col-span-2 bg-[#161b27] border border-[#2f3a52] rounded-xl p-5 shadow-lg h-[350px]">
          <h3 className="text-sm font-bold mb-4">Case Trend (Daily Chat)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3348" vertical={false} />
              <XAxis dataKey="month" stroke="#7a8aaa" fontSize={10} />
              <YAxis stroke="#7a8aaa" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#1c2333', border: '1px solid #2f3a52' }} />
              <Bar dataKey="omnix" fill="#4d8fff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* PLACEHOLDERS (Seperti di HTML kamu) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlaceholderCard title="By Hour" desc="Connecting API later..." />
        <PlaceholderCard title="Top 5 Case" desc="Connecting API later..." />
      </div>
    </div>
  );
}

// Sub-komponen untuk kerapihan
function KpiCard({ title, value, color }: any) {
  return (
    <div className={`bg-[#161b27] border-t-4 ${color} p-5 rounded-lg shadow-md`}>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function PlaceholderCard({ title, desc }: any) {
  return (
    <div className="bg-[#161b27] border border-[#2f3a52] rounded-xl p-5 opacity-60">
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      <p className="text-xs text-gray-500 italic">{desc}</p>
    </div>
  );
}