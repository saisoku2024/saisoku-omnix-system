"use client"

import { useOmnixDashboard } from "@/hooks/useOmnixDashboard"
import KpiCard from "@/components/KpiCard"
import ChannelTable from "@/components/ChannelTable"
import TrendChart from "@/components/TrendChart"

export default function OmnixPage() {
  const { data, loading, error } = useOmnixDashboard()

  if (loading) return <div className="p-6 text-gray-500">Loading dashboard...</div>
  if (error || !data) return <div className="p-6 text-red-500">Error loading data</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-6">

      {/* 🔥 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Omnix Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Monitoring performa Omnichannel & CSAT
          </p>
        </div>

        <div className="text-sm text-gray-400">
          Last update: realtime
        </div>
      </div>

      {/* 🔥 KPI SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.kpis.map((kpi: any) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* 🔥 MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Trend Activity
          </h2>
          <TrendChart data={data.trends} />
        </div>

        {/* CHANNEL */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Channel Distribution
          </h2>
          <ChannelTable data={data.channels} />
        </div>

      </div>

    </div>
  )
}