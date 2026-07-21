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
  LabelList,
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
  highlightedMonths?: string[]
  isDark: boolean
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function formatBarLabel(val: unknown) {
  const num = Number(val)
  if (!num || num <= 0) return ""
  if (num >= 1000) {
    const k = (num / 1000).toFixed(1).replace(/\.0$/, "")
    return `${k}k`
  }
  return String(num)
}

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
  highlightedMonths,
  isDark,
}: Props) {

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const isHighlightAll = !highlightedMonths || highlightedMonths.length === 0

  const maxCount = useMemo(() => {
    const activeData = isHighlightAll
      ? data
      : data.filter((item) => highlightedMonths?.includes(String(item.day).trim()))

    return Math.max(...activeData.map((d) => d.count), 0)
  }, [data, highlightedMonths, isHighlightAll])

  return (
    <div
      className="h-full w-full"
      onMouseLeave={() => setActiveIndex(null)}
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
        <BarChart
          data={data}
          barCategoryGap={mode === "monthly" ? 14 : "30%"}
          margin={{
            top: 24,
            right: 10,
            bottom: 4,
            left: -12,
          }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray={mode === "monthly" ? "2 6" : "3 3"}
            stroke={
              isDark
                ? "rgba(255,255,255,0.045)"
                : "rgba(0,0,0,0.06)"
            }
          />

          <XAxis
            dataKey="day"
            tickFormatter={(v) => formatTick(v, mode)}
            interval={0}
            minTickGap={mode === "monthly" ? 0 : 4}
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
            maxBarSize={mode === "monthly" ? 18 : 38}
            animationDuration={700}
            animationEasing="ease-out"
            onMouseEnter={(_, index) => setActiveIndex(index)}
          >
            {data.map((entry, index) => {
              const isHL =
                isHighlightAll || highlightedMonths?.includes(String(entry.day).trim())

              const isMax =
                entry.count === maxCount && maxCount > 0

              const isHovered = activeIndex === index

              const isOtherHovered =
                activeIndex !== null && !isHovered

              let fill = isMax
                ? isDark ? "#6366f1" : "#6366f1"
                : isHL
                  ? isDark ? "rgba(99,102,241,0.72)" : "rgba(99,102,241,0.78)"
                  : isDark ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.20)"

              if (isHovered) {
                fill = isMax
                  ? "#818cf8"
                  : "#8b5cf6"
              }

              const opacity = isOtherHovered
                ? 0.28
                : 1

              return (
                <Cell
                  key={index}
                  fill={fill}
                  opacity={opacity}
                  stroke={isMax ? "#a5b4fc" : "none"}
                  strokeWidth={isMax ? 1.5 : 0}
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
            <LabelList
              dataKey="count"
              position="top"
              formatter={formatBarLabel}
              style={{
                fontSize: 9,
                fontWeight: 700,
                fill: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export default TrendChart
