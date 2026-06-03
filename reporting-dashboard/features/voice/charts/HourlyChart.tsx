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
  Cell,
  LabelList,
} from "recharts"

import type { HourlyData } from "@/features/voice/types/voice"
import CustomTooltip from "@/features/voice/charts/CustomTooltip"

type Props = {
  data: HourlyData[]
  gridColor: string
  tickColor: string
  isDark: boolean
}

const HourlyChart = memo(function HourlyChart({
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
          margin={{ top: 22, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: tickColor, fontSize: 9 }}
            tickFormatter={(v: string, i: number) => (i % 3 === 0 ? v : "")}
            tickLine={false}
            axisLine={false}
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
            maxBarSize={26}
          >
            {data.map((item, index) => (
              <Cell
                key={index}
                fill="#0ea5e9"
                fillOpacity={item.count > 80 ? 1 : 0.5}
              />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 9, fontWeight: 600, fill: tickColor }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export default HourlyChart