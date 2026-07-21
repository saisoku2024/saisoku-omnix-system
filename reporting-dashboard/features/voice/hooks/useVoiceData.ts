"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { DUMMY } from "@/features/voice/data/dummy"
import { captureClientError } from "@/lib/client-error"
import { fetchVoiceData } from "@/services/voice-service"
import type {
  AgentHandling,
  AgentMetric,
  ByDayData,
  DailyData,
  HourlyData,
  ModeType,
  SummaryData,
} from "@/features/voice/types/voice"

export function useVoiceData(
  mode: ModeType,
  period: string,
  year: number
) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<SummaryData>(DUMMY.summary)
  const [daily, setDaily] = useState<DailyData[]>(DUMMY.daily)
  const [hourly, setHourly] = useState<HourlyData[]>(DUMMY.hourly)
  const [byDay, setByDay] = useState<ByDayData[]>(DUMMY.byDay)
  const [agentHandling, setAgentHandling] = useState<AgentHandling[]>(DUMMY.agentHandling)
  const [agentAht, setAgentAht] = useState<AgentMetric[]>(DUMMY.agentAht)
  const [agentAwt, setAgentAwt] = useState<AgentMetric[]>(DUMMY.agentAwt)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchVoiceData(mode, period, year)
      setSummary(data.summary)
      setDaily(data.daily)
      setHourly(data.hourly)
      setByDay(data.byDay)
      setAgentHandling(data.agentHandling)
      setAgentAht(data.agentAht)
      setAgentAwt(data.agentAwt)
    } catch (err) {
      captureClientError("voice.fetch", err)
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
    daily,
    hourly,
    byDay,
    agentHandling,
    agentAht,
    agentAwt,
    refetch: fetchData,
  }
}
