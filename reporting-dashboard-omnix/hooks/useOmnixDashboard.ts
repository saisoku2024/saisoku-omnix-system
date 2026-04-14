import { useEffect, useState } from "react"
import {
  getDashboardSummary,
  getDashboardTrend,
  getDashboardByChannel,
} from "@/lib/api"

export const useOmnixDashboard = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, trend, channels] = await Promise.all([
          getDashboardSummary(),
          getDashboardTrend(),
          getDashboardByChannel(),
        ])

        const normalized = {
          kpis: [
            { title: "Total Cases", value: summary.total || 0, change: 0 },
            { title: "Resolved", value: summary.resolved || 0, change: 0 },
            { title: "Unresolved", value: summary.unresolved || 0, change: 0 },
          ],
          trends: trend?.map((t: any) => ({
            date: t.date,
            value: t.total || 0,
          })) || [],
          channels: channels?.map((c: any) => ({
            channel: c.channel,
            total: c.total,
          })) || [],
        }

        setData(normalized)
      } catch (err) {
        setError("Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { data, loading, error }
}