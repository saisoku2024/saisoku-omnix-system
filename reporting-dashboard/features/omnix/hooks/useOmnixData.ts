"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { API_BASE } from "@/features/omnix/constants"
import { DUMMY } from "@/features/omnix/data/dummy"
import type {
  ModeType,
  SummaryData,
  TrendData,
  NamedCount,
  TopCase,
  CustomerData,
  OmnixResponse,
} from "@/features/omnix/types/omnix"

// ============================================================
// SANITIZERS
// ============================================================

const EMPTY_SUMMARY: SummaryData = {
  total_ticket: 0,
  aht: "0m 0s",
  art: "0m 0s",
  awt: "0m 0s",
}

/**
 * Sanitize summary per-field. Null/undefined → 0/default.
 * Termasuk handle NaN supaya tidak muncul di KPI Card.
 */
function sanitizeSummary(raw: Partial<SummaryData> | undefined): SummaryData {
  if (!raw) return EMPTY_SUMMARY

  const safeNum = (v: unknown): number => {
    const n = typeof v === "number" ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }

  const safeStr = (v: unknown, fallback: string): string => {
    if (v === null || v === undefined || v === "") return fallback
    return String(v)
  }

  return {
    total_ticket: safeNum(raw.total_ticket),
    aht: safeStr(raw.aht, "0m 0s"),
    art: safeStr(raw.art, "0m 0s"),
    awt: safeStr(raw.awt, "0m 0s"),
  }
}

/**
 * Normalize trend rows.
 * Backend bisa kirim shape lama (`date`/`hour`/`day`) atau shape baru (`label`).
 * Kita coba kedua-duanya supaya FE tetap jalan walau backend belum di-deploy.
 */
function sanitizeTrend(raw: unknown): TrendData[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((r): TrendData => {
      if (!r || typeof r !== "object") return { label: "", count: 0 }

      const row = r as Record<string, unknown>

      // Cari label dari berbagai kemungkinan key
      const rawLabel =
        row.label ??
        row.date ??
        row.hour ??
        row.day ??
        row.month ??
        ""

      // Kalau format date (mis. "2026-01-15"), ambil "15"
      let label = String(rawLabel ?? "")
      if (label.includes("-")) {
        const parts = label.split("-")
        label = parts[parts.length - 1] || label
      }

      // Cari count dari berbagai kemungkinan key
      const rawCount = row.count ?? row.total ?? 0
      const count = Number(rawCount)

      return {
        label,
        count: Number.isFinite(count) ? count : 0,
      }
    })
    // Drop entries yang tidak punya label valid sama sekali
    .filter((d) => d.label !== "")
}

function sanitizeNamedCount(raw: unknown): NamedCount[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r): NamedCount => {
      const row = (r ?? {}) as Record<string, unknown>
      const name = String(row.name ?? "")
      const rawCount = row.count ?? row.total ?? 0
      const count = Number(rawCount)
      return {
        name,
        count: Number.isFinite(count) ? count : 0,
      }
    })
    .filter((d) => d.name !== "")
}

// ============================================================
// HOOK
// ============================================================

export function useOmnixData(
  mode: ModeType,
  period: string,
  year: number
) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<SummaryData>(DUMMY.summary)
  const [trend, setTrend] = useState<TrendData[]>(DUMMY.trend)
  const [channel, setChannel] = useState<NamedCount[]>(DUMMY.channel)
  const [category, setCategory] = useState<NamedCount[]>(DUMMY.category)
  const [product, setProduct] = useState<NamedCount[]>(DUMMY.product)
  const [topCases, setTopCases] = useState<TopCase[]>(DUMMY.top_cases)
  const [customer, setCustomer] = useState<CustomerData[]>(DUMMY.customer)

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

      const res = await fetch(`${API_BASE}/all?${qs.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json: OmnixResponse = await res.json()

      // Sanitize semuanya
      setSummary(sanitizeSummary(json.summary))

      // Backend bisa kirim `trend` (shape baru) atau `daily` (shape lama).
      // sanitizeTrend handle keduanya.
      const rawTrend =
        (json as Record<string, unknown>).trend ??
        (json as Record<string, unknown>).daily
      setTrend(sanitizeTrend(rawTrend))

      setChannel(sanitizeNamedCount(json.channel))
      setCategory(sanitizeNamedCount(json.category))
      setProduct(sanitizeNamedCount(json.product))

      // Top cases & customer — backend belum punya RPC.
      // Tapi defensif terhadap response masa depan yang sudah ada.
      setTopCases(Array.isArray(json.top_cases) ? json.top_cases : [])
      setCustomer(Array.isArray(json.customer) ? json.customer : [])
    } catch (err) {
      console.error("Omnix fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }, [mode, period, year])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchData(), 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchData])

  return {
    loading,
    error,
    summary,
    trend,
    channel,
    category,
    product,
    topCases,
    customer,
    refetch: fetchData,
  }
}

