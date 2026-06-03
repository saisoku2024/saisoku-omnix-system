"use client"

import React, { memo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

import { fmtCompact } from "@/features/omnix/utils/format"
import type { CustomerData } from "@/features/omnix/types/omnix"
import CustomTooltip from "@/features/omnix/charts/CustomTooltip"

type Props = {
  data: CustomerData[]
  gridColor: string
  tickColor: string
}

const CustomerLineChart = memo(function CustomerLineChart({
  data,
  gridColor,
  tickColor,
}: Props) {
  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
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
          />
          <YAxis
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fill: tickColor, fontSize: 10 }}
            tickFormatter={fmtCompact}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total Customer"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#0ea5e9" }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="new"
            name="New Customer"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#22c55e" }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export default CustomerLineChart