"use client";

import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getDashboardByChannel,
  getDashboardTrend,
} from "@/lib/api";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Definisikan Interface agar kodingan lebih aman
interface SummaryData {
  total_omnix_cases: number;
}

interface ChannelData {
  channel: string;
  total: number;
}

export default function OmnixPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [channel, setChannel] = useState<ChannelData[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, c, t] = await Promise.all([
          getDashboardSummary(),
          getDashboardByChannel(),
          getDashboardTrend(),
        ]);

        setSummary(s);
        setChannel(c || []);
        setTrend(t || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 p-6 text-white">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-bold">OMNIX Reporting</h1>
        <p className="text-gray-400">Ticket Interactions, Case Trends, SLA Monitoring</p>
      </div>

      {/* KPI - Gunakan optional chaining (?.) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded shadow">
          <p className="text-sm text-gray-400">Total Ticket</p>
          <p className="text-2xl font-bold">{summary?.total_omnix_cases || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded shadow text-gray-500 italic">AHT: -</div>
        <div className="bg-slate-800 p-4 rounded shadow text-gray-500 italic">ART: -</div>
        <div className="bg-slate-800 p-4 rounded shadow text-gray-500 italic">AWT: -</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Channel Table */}
        <div className="bg-slate-800 p-4 rounded">
          <h3 className="mb-4 font-semibold border-b border-slate-700 pb-2">By Channel</h3>
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400">
                  <th className="pb-2">Channel</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {channel.map((c, i) => (
                  <tr key={i} className="border-t border-slate-700">
                    <td className="py-2 capitalize">{c.channel}</td>
                    <td className="py-2 text-right font-mono">{c.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded flex flex-col justify-center items-center">
           <h3 className="mb-2 font-semibold self-start">By Category</h3>
           <p className="text-gray-500 text-sm">Waiting for Backend...</p>
        </div>

        <div className="bg-slate-800 p-4 rounded flex flex-col justify-center items-center">
           <h3 className="mb-2 font-semibold self-start">By Product</h3>
           <p className="text-gray-500 text-sm">Waiting for Backend...</p>
        </div>
      </div>

      {/* DAILY CHART */}
      <div className="bg-slate-800 p-6 rounded h-[350px]">
        <h3 className="mb-4 font-semibold">Daily Chat Trend</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              itemStyle={{ color: '#38bdf8' }}
            />
            <Bar dataKey="omnix" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}