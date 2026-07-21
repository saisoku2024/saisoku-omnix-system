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
import { fmtCompact } from "@/features/omnix/utils/format"

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

  const peakColor = "#6366f1"
  const normalColor = isDark ? "rgba(99,102,241,0.72)" : "rgba(99,102,241,0.78)"
  const dimColor = isDark ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.20)"

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
              formatter={(value: unknown) => {
                const numericValue = Number(value)
                return numericValue > 0 ? fmtCompact(numericValue) : ""
              }}
              style={{ fontSize: 9, fontWeight: 800, fill: "var(--c-text)" }}
            />
            {data.map((entry) => {
              const label = String(entry.label).trim()
              const isHighlighted = isHighlightAll || highlightedMonths.includes(label)
              const isPeak = entry.count === maxCount && maxCount > 0

              return (
                <Cell
                  key={entry.label}
                  fill={isPeak ? peakColor : isHighlighted ? normalColor : dimColor}
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

export default TrendChart
