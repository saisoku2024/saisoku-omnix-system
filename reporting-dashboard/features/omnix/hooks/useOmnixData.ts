"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { DUMMY } from "@/features/omnix/data/dummy"
import { fetchOmnixData } from "@/services/omnix-service"
import type {
  CustomerData,
  ModeType,
  NamedCount,
  SummaryData,
  TopCase,
  TrendData,
} from "@/features/omnix/types/omnix"

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
      const data = await fetchOmnixData(mode, period, year)
      setSummary(data.summary)
      setTrend(data.trend)
      setChannel(data.channel)
      setCategory(data.category)
      setProduct(data.product)
      setTopCases(data.topCases)
      setCustomer(data.customer)
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
