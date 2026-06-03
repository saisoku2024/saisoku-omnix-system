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

// ============================================================
// TOOLTIP COMPONENT
// ============================================================

interface TooltipPayload {
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
            {p.dataKey === "pct_5" ? "Score 5 ⭐" : "Score 4 ⭐"}
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

// ============================================================
// MAIN CHART COMPONENT
// ============================================================

interface TrendChartProps {
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
  // Dot renderer
  const makeDot = (solidColor: string, ringColor: string, prefix: string) => (props: any) => {
    const { cx, cy, index, payload } = props
    const isHL = highlightedMonths.includes(payload?.month ?? "")
    return (
      <circle
        key={`${prefix}-dot-${index}`}
        cx={cx}
        cy={cy}
        r={isHL ? 5 : 2.5}
        fill={isHL ? solidColor : `${solidColor}33`}
        stroke={isHL ? ringColor : "none"}
        strokeWidth={isHL ? 1.5 : 0}
      />
    )
  }

  // Label renderer
  const makeLabel = (color: string, dy: number, prefix: string) => (props: any) => {
    const { x, y, value, index } = props
    const isHL = highlightedMonths.includes(data[index]?.month ?? "")
    if (!isHL || !value) return null
    return (
      <text
        key={`${prefix}-lbl-${index}`}
        x={x}
        y={y}
        dy={dy}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={color}
      >
        {value}%
      </text>
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
          // Tambahkan padding agar titik Januari/Desember tidak terpotong
          padding={{ left: 16, right: 16 }}
          // Keamanan overflow kliping
          allowDataOverflow={false}
          tick={(props: any) => {
            const isHL = highlightedMonths.includes(props.payload.value)
            return (
              <text
                key={props.payload.value}
                x={props.x}
                y={props.y}
                textAnchor="middle"
                fontSize={isHL ? 11 : 10}
                fontWeight={isHL ? 800 : 400}
                fill={isHL ? (isDark ? "#ffffff" : "#111827") : (isDark ? "#2d3748" : "#d1d5db")}
              >
                {props.payload.value}
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
          // Keamanan overflow kliping
          allowDataOverflow={false}
        />

        <Tooltip content={<TrendTooltip />} />

        <Line
          type="monotone"
          dataKey="pct_5"
          stroke="#22c55e"
          strokeWidth={2.5}
          isAnimationActive={false}
          dot={makeDot("#22c55e", "#15803d", "pct5")}
          label={makeLabel("#22c55e", -12, "pct5")}
        />

        <Line
          type="monotone"
          dataKey="pct_4"
          stroke="#f59e0b"
          strokeWidth={2.5}
          isAnimationActive={false}
          dot={makeDot("#f59e0b", "#b45309", "pct4")}
          label={makeLabel("#f59e0b", 22, "pct4")}
        />
      </LineChart>
    </ResponsiveContainer>
  )
})

export default TrendChart