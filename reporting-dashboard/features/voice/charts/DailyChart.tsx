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
  highlightedLabels?: string[]
  gridColor: string
  tickColor: string
  isDark: boolean
}

const DailyChart = memo(function DailyChart({
  data,
  highlightedLabels = [],
  gridColor,
  tickColor,
  isDark,
}: Props) {
  const maxCount = useMemo(
    () => Math.max(...data.map((item) => item.count), 0),
    [data]
  )

  const tickInterval = 0
  const peakColor = "#22c55e"
  const normalColor = isDark ? "rgba(34,197,94,0.72)" : "rgba(34,197,94,0.78)"
  const hasHighlights = highlightedLabels.length > 0

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
            tick={({ x, y, payload }) => {
              const value = String(payload?.value ?? "")
              const isHighlighted = highlightedLabels.includes(value)

              return (
                <text
                  x={x}
                  y={y}
                  dy={12}
                  textAnchor="middle"
                  fontSize={isHighlighted ? 11 : 10}
                  fontWeight={isHighlighted ? 800 : 500}
                  fill={isHighlighted ? (isDark ? "#ffffff" : "#111827") : tickColor}
                >
                  {value}
                </text>
              )
            }}
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
              const isHighlighted = highlightedLabels.includes(entry.label)
              const shouldHighlight = hasHighlights ? isHighlighted : isPeak

              return (
                <Cell
                  key={entry.label}
                  fill={shouldHighlight ? peakColor : normalColor}
                  fillOpacity={entry.count === 0 ? 0.14 : shouldHighlight ? 1 : 0.5}
                  stroke={shouldHighlight ? "#86efac" : "none"}
                  strokeWidth={shouldHighlight ? 1.5 : 0}
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
