"use client"

import { memo, useMemo } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
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

type DotProps = {
  cx?: number
  cy?: number
  index?: number
  payload?: TrendData
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

  const lineColor = "#6366f1"

  const renderDot = (props: DotProps) => {
    const { cx = 0, cy = 0, index = 0, payload } = props
    const label = String(payload?.label ?? "").trim()
    const isHighlighted = isHighlightAll || highlightedMonths.includes(label)
    const isPeak = payload?.count === maxCount && maxCount > 0

    return (
      <circle
        key={`omnix-dot-${index}`}
        cx={cx}
        cy={cy}
        r={isPeak ? 5 : isHighlighted ? 3.5 : 2.5}
        fill={isHighlighted ? lineColor : `${lineColor}33`}
        stroke={isPeak ? "#a5b4fc" : "none"}
        strokeWidth={isPeak ? 1.5 : 0}
      />
    )
  }

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 28, right: 18, bottom: 12, left: 0 }}>
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
            padding={{ left: 16, right: 16 }}
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
              stroke: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)",
              strokeWidth: 1,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Tickets"
            stroke={lineColor}
            strokeWidth={3}
            isAnimationActive={false}
            dot={renderDot}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export default TrendChart
