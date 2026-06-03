"use client"

import React, { memo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
} from "recharts"

import { PALETTE } from "@/features/omnix/constants"
import type { NamedCountWithPct } from "@/features/omnix/types/omnix"

type Props = {
  data: NamedCountWithPct[]
  total: number
  activeIndex: number | null
  onActiveChange: (idx: number | null) => void
}

type ActiveShapeProps = {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
}

const renderActiveShape = (props: ActiveShapeProps) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ filter: `drop-shadow(0 0 5px ${fill}80)` }}
    />
  )
}

const ChannelDonut = memo(function ChannelDonut({
  data,
  total,
  activeIndex,
  onActiveChange,
}: Props) {
  const totalDisplay = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total)

  return (
    <div className="h-37.5 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            cx="50%"
            cy="50%"
            outerRadius={62}
            innerRadius={44}
            paddingAngle={3}
            cornerRadius={3}
            stroke="none"
            onMouseEnter={(_, i) => onActiveChange(i)}
            onMouseLeave={() => onActiveChange(null)}
              {...(activeIndex !== null ? { activeIndex } : {})}
            activeShape={renderActiveShape as any}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={PALETTE[i % PALETTE.length]}
                opacity={activeIndex !== null && i !== activeIndex ? 0.35 : 1}
                style={{ transition: "opacity 0.2s", cursor: "pointer" }}
              />
            ))}
          </Pie>

          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
          >
            <tspan
              x="50%"
              dy="-5"
              fontSize="18"
              fontWeight="800"
              fill="var(--c-text)"
            >
              {totalDisplay}
            </tspan>
            <tspan
              x="50%"
              dy="15"
              fontSize="8"
              fontWeight="600"
              fill="var(--c-muted)"
              letterSpacing="0.06em"
            >
              TOTAL
            </tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})

export default ChannelDonut