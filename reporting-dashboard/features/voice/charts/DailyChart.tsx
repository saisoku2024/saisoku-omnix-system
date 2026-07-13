"use client"

import { memo, useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import CustomTooltip from "@/features/voice/charts/CustomTooltip"
import type { DailyData } from "@/features/voice/types/voice"

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
    () => Math.max(...data.map((item) => item.count), 0),
    [data]
  )

  const tickInterval = data.length > 20 ? 1 : 0
  const peakColor = "#22c55e"
  const normalColor = isDark ? "rgba(34,197,94,0.72)" : "rgba(34,197,94,0.78)"

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="20%"
          margin={{ top: 30, right: 12, left: 0, bottom: 0 }}
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
            cursor={{
              fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              radius: 6,
            }}
            content={<CustomTooltip suffix=" calls" />}
          />
          <Bar
            dataKey="count"
            radius={[5, 5, 2, 2]}
            isAnimationActive={false}
            maxBarSize={28}
          >
            <LabelList
              dataKey="count"
              position="top"
              formatter={(value: unknown) => {
                const numericValue = Number(value)
                return numericValue > 0 ? String(numericValue) : ""
              }}
              style={{ fontSize: 9, fontWeight: 800, fill: "var(--c-text)" }}
            />
            {data.map((entry) => {
              const isPeak = entry.count === maxCount && maxCount > 0

              return (
                <Cell
                  key={entry.label}
                  fill={isPeak ? peakColor : normalColor}
                  fillOpacity={entry.count === 0 ? 0.14 : 1}
                  stroke={isPeak ? "#86efac" : "none"}
                  strokeWidth={isPeak ? 1.5 : 0}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export default DailyChart
