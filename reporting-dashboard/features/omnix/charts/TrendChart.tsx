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

import CustomTooltip from "@/features/omnix/charts/CustomTooltip"
import type { TrendData } from "@/features/omnix/types/omnix"

function formatFullNumber(value: unknown) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) return ""
  return String(Math.round(numericValue))
}

type Props = {
  data: TrendData[]
  gridColor: string
  tickColor: string
  isDark: boolean
  highlightedMonths?: string[]
}

const TrendChart = memo(function TrendChart({
  data,
  gridColor,
  tickColor,
  isDark,
  highlightedMonths = [],
}: Props) {
  const isHighlightAll = highlightedMonths.length === 0

  const maxCount = useMemo(() => {
    const activeData = isHighlightAll
      ? data
      : data.filter((item) => highlightedMonths.includes(String(item.label).trim()))

    return Math.max(...activeData.map((item) => item.count), 0)
  }, [data, highlightedMonths, isHighlightAll])

  const peakColor = "#22c55e"
  const normalColor = "#16a34a"

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
        <BarChart
          data={data}
          margin={{ top: 30, right: 8, bottom: 0, left: 0 }}
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
            tick={({ x, y, payload }) => {
              const value = String(payload?.value ?? "")
              const isHL = !isHighlightAll && highlightedMonths.includes(value)

              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontSize={isHL ? 11 : 10}
                  fontWeight={isHL ? 800 : 500}
                  fill={isHL ? (isDark ? "#ffffff" : "#111827") : tickColor}
                >
                  {value}
                </text>
              )
            }}
            padding={{ left: 4, right: 4 }}
          />
          <YAxis
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fill: tickColor, fontSize: 10 }}
            tickFormatter={(value) => String(Math.round(Number(value) || 0))}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.04)",
              radius: 6,
            }}
          />
          <Bar
            dataKey="count"
            name="Tickets"
            radius={[6, 6, 2, 2]}
            maxBarSize={38}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="count"
              position="top"
              formatter={formatFullNumber}
              style={{ fontSize: 9, fontWeight: 800, fill: "var(--c-text)" }}
            />
            {data.map((entry) => {
              const label = String(entry.label).trim()
              const isHighlighted = isHighlightAll || highlightedMonths.includes(label)
              const isPeak = entry.count === maxCount && maxCount > 0

              return (
                <Cell
                  key={entry.label}
                  fill={isPeak ? peakColor : normalColor}
                  fillOpacity={entry.count === 0 ? 0.14 : isHighlighted ? 0.95 : 0.45}
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

export default TrendChart
