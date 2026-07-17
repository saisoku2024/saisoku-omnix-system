"use client"

import React, { memo } from "react"
import {
  PieChart,
  Pie,
  Cell,
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

const ChannelDonut = memo(function ChannelDonut({
  data,
  total,
  activeIndex,
  onActiveChange,
}: Props) {
  const totalDisplay = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total)
  const activeItem = activeIndex !== null ? data[activeIndex] : null
  const centerValue = activeItem
    ? `${activeItem.pct}%`
    : totalDisplay
  const centerLabel = activeItem
    ? activeItem.name
    : "TOTAL"

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            cx="50%"
            cy="50%"
            outerRadius={66}
            innerRadius={40}
            paddingAngle={4}
            cornerRadius={5}
            stroke="none"
            onMouseEnter={(_, i) => onActiveChange(i)}
            onMouseLeave={() => onActiveChange(null)}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={PALETTE[i % PALETTE.length]}
                opacity={activeIndex !== null && i !== activeIndex ? 0.35 : 1}
                stroke={activeIndex === i ? "var(--c-surface)" : "none"}
                strokeWidth={activeIndex === i ? 3 : 0}
                style={{
                  cursor: "pointer",
                  filter: activeIndex === i ? `drop-shadow(0 0 8px ${PALETTE[i % PALETTE.length]}66)` : "none",
                  transition: "opacity 0.2s, filter 0.2s",
                }}
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
              {centerValue}
            </tspan>
            <tspan
              x="50%"
              dy="15"
              fontSize="8"
              fontWeight="600"
              fill="var(--c-muted)"
              letterSpacing="0.06em"
            >
              {centerLabel.length > 12 ? `${centerLabel.slice(0, 12)}...` : centerLabel}
            </tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})

export default ChannelDonut
