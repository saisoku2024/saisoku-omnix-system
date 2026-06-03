"use client"

import React, { memo, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts"

import { fmtCompact } from "@/features/omnix/utils/format"
import type { TrendData } from "@/features/omnix/types/omnix"
import CustomTooltip from "@/features/omnix/charts/CustomTooltip"

type Props = {
  data: TrendData[]
  gridColor: string
  tickColor: string
  isDark: boolean
  highlightedMonths?: string[] // SIVA FIX: Tambahan prop untuk menerima instruksi highlight
}

const TrendChart = memo(function TrendChart({
  data,
  gridColor,
  tickColor,
  isDark,
  highlightedMonths = [],
}: Props) {
  
  const isHighlightAll = highlightedMonths.length === 0

  // SIVA FIX: Cari nilai tertinggi HANYA pada area yang sedang di-highlight
  const maxCount = useMemo(() => {
    const activeData = isHighlightAll 
      ? data 
      : data.filter(d => highlightedMonths.includes(String(d.label).trim()))
    return Math.max(...activeData.map((d) => d.count), 0)
  }, [data, highlightedMonths, isHighlightAll])

  // Palet Warna
  const peakColor = "#6366f1" // Ungu terang (Tertinggi)
  const normalColor = isDark ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.6)" // Ungu normal (Di-highlight)
  const dimColor = isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.15)" // Pudar (Tidak di-highlight)

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 22, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            dy={8}
            tick={{ fill: tickColor, fontSize: 10 }}
            padding={{ left: 4, right: 4 }}
          />
          <YAxis
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fill: tickColor, fontSize: 10 }}
            tickFormatter={fmtCompact}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.04)",
            }}
          />
          <Bar
            dataKey="count"
            name="Tickets"
            radius={[5, 5, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          >
            {data.map((entry, i) => {
              const labelStr = String(entry.label).trim()
              const isHighlighted = isHighlightAll || highlightedMonths.includes(labelStr)
              const isPeak = entry.count === maxCount && maxCount > 0
              
              // SIVA FIX: Logika penggabungan warna (Dim vs Normal vs Peak)
              let fill = dimColor
              if (isHighlighted) {
                fill = isPeak ? peakColor : normalColor
              }

              return (
                <Cell
                  key={i}
                  fill={fill}
                  stroke={isPeak ? peakColor : "none"}
                  strokeWidth={isPeak ? 1 : 0}
                />
              )
            })}
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 9, fontWeight: 600, fill: tickColor }}
              formatter={(val: any) =>
  typeof val === "number"
    ? val >= 1000
      ? `${(val / 1000).toFixed(1)}k`
      : val
    : val
}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export default TrendChart