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
import type { ByDayData } from "@/features/voice/types/voice"

type Props = {
  data: ByDayData[]
  gridColor: string
  tickColor: string
  isDark: boolean
}

const ByDayChart = memo(function ByDayChart({
  data,
  gridColor,
  tickColor,
  isDark,
}: Props) {
  const maxCount = useMemo(
    () => Math.max(...data.map((item) => item.count), 0),
    [data]
  )

  const peakColor = "#6366f1"
  const normalColor = isDark ? "rgba(99,102,241,0.72)" : "rgba(99,102,241,0.78)"

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 12, left: 0, bottom: 0 }}
          barCategoryGap="26%"
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
            padding={{ left: 8, right: 8 }}
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
            maxBarSize={48}
          >
            <LabelList
              dataKey="count"
              position="top"
              formatter={(value: unknown) => {
                const numericValue = Number(value)
                return numericValue > 0 ? String(numericValue) : ""
              }}
              style={{ fontSize: 10, fontWeight: 800, fill: "var(--c-text)" }}
            />
            {data.map((entry) => {
              const isPeak = entry.count === maxCount && maxCount > 0

              return (
                <Cell
                  key={entry.label}
                  fill={isPeak ? peakColor : normalColor}
                  fillOpacity={entry.count === 0 ? 0.14 : 1}
                  stroke={isPeak ? "#a5b4fc" : "none"}
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

export default ByDayChart
