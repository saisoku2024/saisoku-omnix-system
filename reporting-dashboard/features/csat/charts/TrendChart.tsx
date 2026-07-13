"use client"

import { memo } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import type { TrendRow } from "@/features/csat/types/csat"

type TooltipPayload = {
  dataKey?: string
  name?: string
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
        minWidth: 160,
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

      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "2px 0",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color ?? p.fill,
            }}
          />
          <span style={{ color: "var(--c-muted)", fontSize: 11 }}>
            Score 4+5
          </span>
          <span
            style={{
              fontWeight: 700,
              color: "var(--c-text)",
              marginLeft: "auto",
              paddingLeft: 12,
              fontSize: 11,
            }}
          >
            {p.value}%
          </span>
        </div>
      ))}
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

type DotProps = {
  cx?: number
  cy?: number
  index?: number
  payload?: TrendRow
}

type TickProps = {
  x?: number | string
  y?: number | string
  payload?: {
    value?: string
  }
}

const TrendChart = memo(function TrendChart({
  data,
  highlightedMonths,
  isDark,
  tickColor,
  gridColor,
}: TrendChartProps) {
  const makeDot = (solidColor: string, ringColor: string) => (props: DotProps) => {
    const { cx = 0, cy = 0, index = 0, payload } = props
    const isHL = highlightedMonths.includes(payload?.month ?? "")

    return (
      <circle
        key={`positive-dot-${index}`}
        cx={cx}
        cy={cy}
        r={isHL ? 5 : 2.5}
        fill={isHL ? solidColor : `${solidColor}33`}
        stroke={isHL ? ringColor : "none"}
        strokeWidth={isHL ? 1.5 : 0}
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 28, right: 18, bottom: 12, left: 12 }}>
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
          padding={{ left: 16, right: 16 }}
          allowDataOverflow={false}
          tick={(props: TickProps) => {
            const value = props.payload?.value ?? ""
            const isHL = highlightedMonths.includes(value)

            return (
              <text
                key={value}
                x={props.x ?? 0}
                y={props.y ?? 0}
                textAnchor="middle"
                fontSize={isHL ? 11 : 10}
                fontWeight={isHL ? 800 : 400}
                fill={isHL ? (isDark ? "#ffffff" : "#111827") : (isDark ? "#2d3748" : "#d1d5db")}
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
          width={34}
          allowDataOverflow={false}
        />

        <Tooltip content={<TrendTooltip />} />

        <Line
          type="monotone"
          dataKey="positive_pct"
          name="Score 4+5"
          stroke="#22c55e"
          strokeWidth={3}
          isAnimationActive={false}
          dot={makeDot("#22c55e", "#15803d")}
        />
      </LineChart>
    </ResponsiveContainer>
  )
})

export default TrendChart
