import { memo } from "react"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Cell,
} from "recharts"
import type { LabelProps } from "recharts"

import type { DistRow } from "@/features/csat/types/csat"

import { barColor } from "@/features/csat/utils/chart"

interface TooltipPayload {
  value: number
}

function DistTooltip({
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
      }}
    >
      <p
        style={{
          color: "var(--c-muted)",
          marginBottom: 4,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        Rating {label}
      </p>

      <p
        style={{
          fontWeight: 700,
          color: "var(--c-text)",
          fontSize: 14,
        }}
      >
        {payload[0]?.value ?? 0}
      </p>
    </div>
  )
}

interface DistributionChartProps {
  data: DistRow[]
  gridColor: string
  tickColor: string
  isDark: boolean
}

function DistributionValueLabel(props: LabelProps) {
  const x = Number(props.x ?? 0)
  const y = Number(props.y ?? 0)
  const width = Number(props.width ?? 0)
  const value = Number(props.value ?? 0)

  if (!value) return null

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill="var(--c-text)"
    >
      {value}
    </text>
  )
}

const DistributionChart = memo(function DistributionChart({
  data,
  gridColor,
  tickColor,
  isDark,
}: DistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
      <BarChart
        data={data}
        margin={{ top: 26, right: 5, bottom: 0, left: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={gridColor}
          vertical={false}
        />

        <XAxis
          dataKey="rating"
          stroke="transparent"
          tickLine={false}
          axisLine={false}
          dy={8}
          tick={{
            fill: "var(--c-muted)",
            fontSize: 12,
            fontWeight: 700,
          }}
        />

        <YAxis
          stroke="transparent"
          tickLine={false}
          axisLine={false}
          tick={{ fill: tickColor, fontSize: 10 }}
          width={36}
        />

        <Tooltip
          content={<DistTooltip />}
          cursor={{
            fill: isDark
              ? "rgba(255,255,255,0.025)"
              : "rgba(0,0,0,0.04)",
            radius: 6,
          }}
        />

        <Bar
          dataKey="value"
          radius={[7, 7, 3, 3]}
          maxBarSize={52}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="value"
            position="top"
            content={DistributionValueLabel}
          />

          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={barColor(entry.rating)}
              fillOpacity={entry.value === 0 ? 0.12 : 0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

export default DistributionChart
