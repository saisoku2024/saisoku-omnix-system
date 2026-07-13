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

import CustomTooltip from "@/features/voice/charts/CustomTooltip"
import type { ByDayData } from "@/features/voice/types/voice"

type Props = {
  data: ByDayData[]
  gridColor: string
  tickColor: string
  isDark: boolean
}

type DotProps = {
  cx?: number
  cy?: number
  index?: number
  payload?: ByDayData
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

  const lineColor = "#6366f1"

  const renderDot = (props: DotProps) => {
    const { cx = 0, cy = 0, index = 0, payload } = props
    const isPeak = payload?.count === maxCount && maxCount > 0

    return (
      <circle
        key={`by-day-dot-${index}`}
        cx={cx}
        cy={cy}
        r={isPeak ? 5 : 3}
        fill={lineColor}
        fillOpacity={isPeak ? 1 : 0.55}
        stroke={isPeak ? "#a5b4fc" : "none"}
        strokeWidth={isPeak ? 1.5 : 0}
      />
    )
  }

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 28, right: 18, left: 0, bottom: 12 }}>
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
            padding={{ left: 16, right: 16 }}
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
              stroke: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)",
              strokeWidth: 1,
            }}
            content={<CustomTooltip suffix=" calls" />}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Calls"
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

export default ByDayChart
