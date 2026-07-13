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

import type { TrendRow } from "@/features/csat/types/csat"

type TooltipPayload = {
  value: number
  color?: string
  fill?: string
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        minWidth: 150,
      }}
    >
      <p
        style={{
          color: "var(--c-muted)",
          marginBottom: 6,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: payload[0]?.color ?? payload[0]?.fill ?? "#22c55e",
          }}
        />
        <span style={{ color: "var(--c-muted)", fontSize: 11 }}>Score 4+5</span>
        <span style={{ marginLeft: "auto", color: "var(--c-text)", fontSize: 12, fontWeight: 800 }}>
          {payload[0]?.value ?? 0}%
        </span>
      </div>
    </div>
  )
}

type TrendChartProps = {
  data: TrendRow[]
  highlightedMonths: string[]
  isDark: boolean
  tickColor: string
  gridColor: string
}

const TrendChart = memo(function TrendChart({
  data,
  highlightedMonths,
  isDark,
  tickColor,
  gridColor,
}: TrendChartProps) {
  const maxValue = useMemo(
    () => Math.max(...data.map((item) => item.positive_pct), 0),
    [data]
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 30, right: 12, bottom: 12, left: 0 }} barCategoryGap="28%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={gridColor}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke="transparent"
          tickLine={false}
          axisLine={false}
          dy={8}
          padding={{ left: 10, right: 10 }}
          tick={({ x, y, payload }) => {
            const value = String(payload?.value ?? "")
            const isHL = highlightedMonths.includes(value)

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
        />
        <YAxis
          stroke="transparent"
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: tickColor, fontSize: 10 }}
          width={36}
        />
        <Tooltip
          content={<TrendTooltip />}
          cursor={{
            fill: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.04)",
            radius: 6,
          }}
        />
        <Bar
          dataKey="positive_pct"
          name="Score 4+5"
          radius={[7, 7, 3, 3]}
          maxBarSize={42}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="positive_pct"
            position="top"
            formatter={(value: unknown) => {
              const numericValue = Number(value)
              return numericValue > 0 ? `${numericValue}%` : ""
            }}
            style={{ fontSize: 10, fontWeight: 800, fill: "var(--c-text)" }}
          />
          {data.map((entry, index) => {
            const isHL = highlightedMonths.includes(entry.month)
            const isPeak = entry.positive_pct === maxValue && maxValue > 0

            return (
              <Cell
                key={entry.month}
                fill={isPeak ? "#22c55e" : "#16a34a"}
                fillOpacity={entry.positive_pct === 0 ? 0.14 : isHL ? 0.95 : 0.45}
                stroke={isPeak ? "#86efac" : "none"}
                strokeWidth={isPeak ? 1.5 : 0}
                style={{ transition: "opacity 180ms ease" }}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

export default TrendChart
