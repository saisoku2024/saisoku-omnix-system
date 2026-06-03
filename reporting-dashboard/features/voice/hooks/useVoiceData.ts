"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { API_BASE } from "@/features/voice/constants"
import { DUMMY } from "@/features/voice/data/dummy"

import type {
  ModeType,
  SummaryData,
  DailyData,
  HourlyData,
  ByDayData,
  AgentHandling,
  AgentMetric,
  VoiceResponse,
} from "@/features/voice/types/voice"

// Empty state default untuk summary (BUKAN DUMMY).
// Dipakai saat API balikin null/missing field.
const EMPTY_SUMMARY: SummaryData = {
  total_calls: 0,
  answered: 0,
  abandon: 0,
  aht: "0m 0s",
  awt: "0m 0s",
  scr: 0,
}

/**
 * Sanitize summary per-field.
 *
 * Kenapa perlu ini, padahal udah pakai `??`?
 * `json.summary ?? DUMMY.summary` hanya fallback kalau objeknya null.
 * Tapi API bisa balikin object dengan field null:
 *   { total_calls: null, answered: 88, scr: null }
 * → objeknya truthy → `??` tidak fallback → total_calls jadi null →
 *   `fmt(null)` → "0", `${null}%` → "0%"
 * Ini bug yang muncul di screenshot KPI Total Calls & SCR.
 */
function sanitizeSummary(raw: Partial<SummaryData> | undefined): SummaryData {
  if (!raw) return EMPTY_SUMMARY

  return {
    total_calls: raw.total_calls ?? 0,
    answered: raw.answered ?? 0,
    abandon: raw.abandon ?? 0,
    aht: raw.aht ?? "0m 0s",
    awt: raw.awt ?? "0m 0s",
    scr: raw.scr ?? 0,
  }
}

export function useVoiceData(
  mode: ModeType,
  period: string,
  year: number
) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initial state pakai DUMMY supaya transisi loading→data halus.
  // Setelah fetch selesai, kalau API gagal kirim, fallback ke array kosong
  // (bukan DUMMY) — supaya user tidak salah lihat data palsu sebagai data real.
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
      const safePeriod =
        mode === "yearly"
          ? "all"
          : mode === "quarterly"
            ? period.startsWith("Q") ? period : "Q1"
            : period

      const qs = new URLSearchParams({
        mode,
        period: safePeriod,
        year: String(year),
      })

      const url = `${API_BASE}/all?${qs.toString()}`

      console.log("VOICE API:", url)

      const response = await fetch(url, { cache: "no-store" })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const json: VoiceResponse = await response.json()

      console.log("VOICE RESPONSE:", json)

      // Sanitize summary — fix bug "Total Calls / SCR = 0"
      setSummary(sanitizeSummary(json.summary))

      // Untuk array: kalau gagal/missing, kosongkan supaya EmptyState muncul.
      // Hindari DUMMY supaya user tidak salah baca dummy = data real.
      setDaily(Array.isArray(json.daily) ? json.daily : [])
      setHourly(Array.isArray(json.hourly) ? json.hourly : [])
      setByDay(Array.isArray(json.byDay) ? json.byDay : [])
      setAgentHandling(Array.isArray(json.agentHandling) ? json.agentHandling : [])
      setAgentAht(Array.isArray(json.agentAht) ? json.agentAht : [])
      setAgentAwt(Array.isArray(json.agentAwt) ? json.agentAwt : [])
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : "Failed to fetch data"
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
    daily,
    hourly,
    byDay,
    agentHandling,
    agentAht,
    agentAwt,
    refetch: fetchData,
  }
}