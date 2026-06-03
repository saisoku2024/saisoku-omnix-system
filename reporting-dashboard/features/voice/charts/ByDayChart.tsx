"use client"

import React, { memo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts"

import type { ByDayData } from "@/features/voice/types/voice"
import CustomTooltip from "@/features/voice/charts/CustomTooltip"

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
  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
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
            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
            content={<CustomTooltip suffix=" calls" />}
          />
          <Bar
            dataKey="count"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            maxBarSize={48}
          >
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 10, fontWeight: 600, fill: tickColor }}
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

export default ByDayChart