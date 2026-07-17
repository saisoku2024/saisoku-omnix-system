"use client"

import React, { memo, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"

import BarTooltip from "@/features/dashboard/charts/BarTooltip"
import type { ModeType } from "@/features/dashboard/types/dashboard"

type TrendPoint = {
  day: string
  count: number
}

type Props = {
  data: TrendPoint[]
  mode: ModeType
  isDark: boolean
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function formatTick(value: string, mode: ModeType): string {
  if (mode === "monthly") {
    if (typeof value === "string" && value.includes("-")) {
      const parts = value.split("-")
      return (parts[2] ?? "").padStart(2, "0") || value
    }

    return value
  }

  if (mode === "yearly") {
    const n = Number(value)

    if (Number.isFinite(n) && n >= 1 && n <= 12) {
      return MONTH_LABELS[n - 1]
    }
  }

  return String(value)
}

const TrendChart = memo(function TrendChart({
  data,
  mode,
  isDark,
}: Props) {

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.count), 0),
    [data]
  )

  return (
    <div
      className="h-full w-full"
      onMouseLeave={() => setActiveIndex(null)}
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
        <BarChart
          data={data}
          barCategoryGap={mode === "yearly" ? 28 : 14}
          margin={{
            top: 12,
            right: 10,
            bottom: 4,
            left: -12,
          }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="2 6"
            stroke={
              isDark
                ? "rgba(255,255,255,0.045)"
                : "rgba(0,0,0,0.06)"
            }
          />

          <XAxis
            dataKey="day"
            tickFormatter={(v) => formatTick(v, mode)}
            interval={mode === "monthly" ? 0 : "preserveEnd"}
            minTickGap={mode === "monthly" ? 0 : 5}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{
              fontSize: 10,
              fill: "var(--c-muted)",
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            width={34}
            tickMargin={8}
            tick={{
              fontSize: 10,
              fill: "var(--c-muted)",
            }}
          />

          <Tooltip
            content={<BarTooltip />}
            cursor={{
              fill: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.03)",
              radius: 6,
            }}
          />

          <Bar
            dataKey="count"
            radius={[8, 8, 2, 2]}
            maxBarSize={18}
            animationDuration={700}
            animationEasing="ease-out"
            onMouseEnter={(_, index) => setActiveIndex(index)}
          >
            {data.map((entry, index) => {
              const isMax =
                entry.count === maxCount && maxCount > 0

              const isHovered = activeIndex === index

              const isOtherHovered =
                activeIndex !== null && !isHovered

              let fill = isMax
                ? "#22c55e"
                : "#0ea5e9"

              if (isHovered) {
                fill = isMax
                  ? "#4ade80"
                  : "#38bdf8"
              }

              return (
                <Cell
                  key={index}
                  fill={fill}
                  opacity={isOtherHovered ? 0.28 : 1}
                  style={{
                    transition:
                      "all 220ms cubic-bezier(0.4,0,0.2,1)",
                    cursor: "pointer",
                    filter: isHovered
                      ? "drop-shadow(0 0 10px rgba(14,165,233,0.45))"
                      : "none",
                  }}
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
