"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/lib/api";

export default function Page() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getDashboardSummary().then(setData);
  }, []);

  if (!data) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-5 gap-4">

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/20 border border-blue-500/20 p-4 rounded-xl shadow">
          <p className="text-xs text-slate-400">Total Ticket</p>
          <p className="text-2xl font-bold mt-1">{data.total_ticket || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-900/20 border border-green-500/20 p-4 rounded-xl shadow">
          <p className="text-xs text-slate-400">AHT</p>
          <p className="text-2xl font-bold mt-1">{data.aht || "-"}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-900/20 border border-yellow-500/20 p-4 rounded-xl shadow">
          <p className="text-xs text-slate-400">ART</p>
          <p className="text-2xl font-bold mt-1">{data.art || "-"}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/20 border border-purple-500/20 p-4 rounded-xl shadow">
          <p className="text-xs text-slate-400">AWT</p>
          <p className="text-2xl font-bold mt-1">{data.awt || "-"}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-900/20 border border-cyan-500/20 p-4 rounded-xl shadow">
          <p className="text-xs text-slate-400">CSAT</p>
          <p className="text-2xl font-bold mt-1">{data.csat || "-"}</p>
        </div>

      </div>

      {/* CHART */}
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow">
        <p className="text-sm font-semibold mb-3">Daily Chat</p>

        <div className="h-48 flex items-center justify-center text-slate-500">
          Chart (next step)
        </div>
      </div>

      {/* TABLE META */}
      <div className="grid grid-cols-3 gap-4">

        {/* CHANNEL */}
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow text-xs">
          <p className="mb-2 font-semibold text-slate-300">Channel</p>
          {(data.channel || []).slice(0,5).map((item:any,i:number)=>(
            <div key={i} className="flex justify-between py-1 border-b border-slate-700 last:border-none">
              <span>{item.name}</span>
              <span className="text-slate-400">{item.value}</span>
            </div>
          ))}
        </div>

        {/* CATEGORY */}
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow text-xs">
          <p className="mb-2 font-semibold text-slate-300">Category</p>
          {(data.category || []).slice(0,5).map((item:any,i:number)=>(
            <div key={i} className="flex justify-between py-1 border-b border-slate-700 last:border-none">
              <span>{item.name}</span>
              <span className="text-slate-400">{item.value}</span>
            </div>
          ))}
        </div>

        {/* PRODUCT */}
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow text-xs">
          <p className="mb-2 font-semibold text-slate-300">Product</p>
          {(data.product || []).slice(0,5).map((item:any,i:number)=>(
            <div key={i} className="flex justify-between py-1 border-b border-slate-700 last:border-none">
              <span>{item.name}</span>
              <span className="text-slate-400">{item.value}</span>
            </div>
          ))}
        </div>

      </div>

      {/* CUSTOMER */}
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow">
        <p className="text-sm font-semibold mb-3">Customer Summary</p>

        <div className="flex gap-10">
          <div>
            <p className="text-xs text-slate-400">Customer</p>
            <p className="text-xl font-bold">{data.customer || 0}</p>
          </div>

          <div>
            <p className="text-xs text-slate-400">New Customer</p>
            <p className="text-xl font-bold">{data.new_customer || 0}</p>
          </div>
        </div>
      </div>

    </div>
  );
}