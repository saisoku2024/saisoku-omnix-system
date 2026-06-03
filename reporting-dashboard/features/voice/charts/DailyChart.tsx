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

import type { DailyData } from "@/features/voice/types/voice"
import CustomTooltip from "@/features/voice/charts/CustomTooltip"

type Props = {
  data: DailyData[]
  gridColor: string
  tickColor: string
  isDark: boolean
}

const DailyChart = memo(function DailyChart({
  data,
  gridColor,
  tickColor,
  isDark,
}: Props) {
  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.count), 0),
    [data]
  )

  const peakColor = "#22c55e"
  const dimColor = isDark ? "rgba(34,197,94,0.55)" : "rgba(34,197,94,0.65)"

  // Untuk dataset banyak (mis. 31 hari), tampilkan label X tiap 2 hari
  const tickInterval = data.length > 20 ? 1 : 0

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="20%"
          margin={{ top: 24, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: tickColor, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            padding={{ left: 4, right: 4 }}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
            content={<CustomTooltip suffix=" calls" />}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            maxBarSize={28}
          >
            {data.map((entry, idx) => {
              const isPeak = entry.count === maxCount && maxCount > 0
              return (
                <Cell
                  key={idx}
                  fill={isPeak ? peakColor : dimColor}
                  stroke={isPeak ? peakColor : "none"}
                  strokeWidth={isPeak ? 1 : 0}
                />
              )
            })}
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 9, fontWeight: 600, fill: tickColor }}
              formatter={(val: number) =>
                val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
              }
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export default DailyChart