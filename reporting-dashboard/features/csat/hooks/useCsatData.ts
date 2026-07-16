import { useCallback, useEffect, useRef, useState } from "react"

import { fetchCsatData } from "@/services/csat-service"
import type {
  AgentAvg,
  AgentTotal,
  ModeType,
  SummaryData,
  TrendRaw,
} from "@/features/csat/types/csat"

const EMPTY_SUMMARY: SummaryData = {
  total_response: 0,
  high_score: 0,
  low_score: 0,
  avg_csat: 0,
}

export function useCsatData(
  mode: ModeType,
  period: string,
  year: number
) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<SummaryData>(EMPTY_SUMMARY)
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
      const data = await fetchCsatData(mode, period, year)
      setSummary(data.summary)
      setRawTrend(data.rawTrend)
      setRawDistribution(data.rawDistribution)
      setTopAgentTotal(data.topAgentTotal)
      setTopAgentAvg(data.topAgentAvg)
    } catch (err) {
      console.error("CSAT fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
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
