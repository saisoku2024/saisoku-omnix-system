import { useState, useCallback, useEffect, useMemo } from "react"

import {
  buildDashboardChannelPie,
  buildDashboardTrendData,
  isValidDashboardPeriod,
} from "@/features/dashboard/utils/data"
import { captureClientError } from "@/lib/client-error"
import { fetchDashboardAll } from "@/services/dashboard-service"
import type {
  BrandItem,
  CategoryItem,
  ChannelItem,
  ModeType,
  PieItemWithPct,
  StatsData,
  TrendItem,
} from "../types/dashboard"

const EMPTY_STATS: StatsData = {
  total_ticket: "-",
  aht: "-",
  art: "-",
  awt: "-",
  csat: "-",
}

export function useDashboardData(mode: ModeType, period: string, year: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsData>(EMPTY_STATS)
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [channel, setChannel] = useState<ChannelItem[]>([])
  const [category, setCategory] = useState<CategoryItem[]>([])
  const [brand, setBrand] = useState<BrandItem[]>([])
  const [customer, setCustomer] = useState(0)
  const [newCustomer, setNewCustomer] = useState(0)

  const fetchAll = useCallback(() => {
    if (!isValidDashboardPeriod(mode, period)) return

    setLoading(true)
    setError(null)

    fetchDashboardAll(mode, period, year)
      .then((data) => {
        setStats(data.stats)
        setTrend(data.trend)
        setChannel(data.channel)
        setCategory(data.category)
        setBrand(data.brand)
        setCustomer(data.customer)
        setNewCustomer(data.newCustomer)
      })
      .catch((err) => {
        captureClientError("dashboard.fetch", err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [mode, period, year])

  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0)
    return () => clearTimeout(timer)
  }, [fetchAll])

  const trendData = useMemo(
    () => buildDashboardTrendData(mode, period, year, trend),
    [mode, period, trend, year]
  )

  const channelPie: PieItemWithPct[] = useMemo(
    () => buildDashboardChannelPie(channel),
    [channel]
  )

  const trendMax = useMemo(() => trendData.reduce((max, item) => Math.max(max, item.count), 0), [trendData])
  const channelMax = useMemo(() => channelPie.reduce((max, item) => Math.max(max, item.count), 0), [channelPie])
  const categoryMax = useMemo(() => category.reduce((max, item) => Math.max(max, item.count), 0), [category])

  return {
    loading,
    error,
    stats,
    trendData,
    channelPie,
    category,
    brand,
    customer,
    newCustomer,
    trendMax,
    channelMax,
    categoryMax,
  }
}
