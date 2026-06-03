import { useCallback, useEffect, useRef, useState } from "react"

import { API_BASE } from "@/features/csat/constants"

import type {
  ModeType,
  SummaryData,
  TrendRaw,
  AgentTotal,
  AgentAvg,
  CsatResponse,
} from "@/features/csat/types/csat"

export function useCsatData(
  mode: ModeType,
  period: string,
  year: number
) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<SummaryData>({
    total_response: 0,
    high_score: 0,
    low_score: 0,
    avg_csat: 0,
  })

  const [rawTrend, setRawTrend] = useState<TrendRaw[]>([])

  const [rawDistribution, setRawDistribution] = useState<
    Array<{ rating: number | string; count?: number; avg?: number }>
  >([])

  const [topAgentTotal, setTopAgentTotal] = useState<AgentTotal[]>([])

  const [topAgentAvg, setTopAgentAvg] = useState<AgentAvg[]>([])

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const safePeriod =
        mode === "yearly"
          ? "all"
          : mode === "quarterly"
            ? period.startsWith("Q")
              ? period
              : "Q1"
            : period

      const qs = new URLSearchParams({
        mode,
        period: safePeriod,
        year: String(year),
      })

      const res = await fetch(`${API_BASE}/all?${qs.toString()}`, {
        cache: "no-store",
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const json: CsatResponse = await res.json()

      setSummary(
        json.summary ?? {
          total_response: 0,
          high_score: 0,
          low_score: 0,
          avg_csat: 0,
        }
      )

      setRawTrend(Array.isArray(json.trend) ? json.trend : [])

      setRawDistribution(
        Array.isArray(json.distribution)
          ? json.distribution
          : []
      )

      setTopAgentTotal(
        Array.isArray(json.top_agent_total)
          ? json.top_agent_total
          : []
      )

      setTopAgentAvg(
        Array.isArray(json.top_agent_avg)
          ? json.top_agent_avg
          : []
      )
    } catch (err) {
      console.error("CSAT fetch error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch data"
      )
    } finally {
      setLoading(false)
    }
  }, [mode, period, year])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchData()
    }, 250)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [fetchData])

  return {
    loading,
    error,
    summary,
    rawTrend,
    rawDistribution,
    topAgentTotal,
    topAgentAvg,
  }
}