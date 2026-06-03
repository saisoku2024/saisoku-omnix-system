"use client"

import React, { memo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
} from "recharts"

import { PALETTE } from "@/features/dashboard/constants"
import { formatCount } from "@/features/dashboard/utils/format"
import type { PieItemWithPct } from "@/features/dashboard/types/dashboard"

type Props = {
  data: PieItemWithPct[]
  total: number
  maxCount: number
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
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{
        filter: `drop-shadow(0 0 10px ${fill}90)`,
        transition: "all 220ms ease",
      }}
    />
  )
}

type LabelProps = {
  cx: number
  cy: number
  midAngle?: number
  outerRadius: number
  percent: number
}

const renderLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
}: LabelProps) => {

  if (midAngle === undefined || percent < 0.04) {
    return null
  }

  const RADIAN = Math.PI / 180

  const radius = outerRadius + 20

  const x =
    cx + radius * Math.cos(-midAngle * RADIAN)

  const y =
    cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="var(--c-muted)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

const ChannelDonut = memo(function ChannelDonut({
  data,
  total,
  maxCount,
  activeIndex,
  onActiveChange,
}: Props) {

  return (
    <div className="h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>

          <Pie
            data={data}
            dataKey="count"
            nameKey="name"

            cx="50%"
            cy="50%"

            innerRadius={54}
            outerRadius={70}

            paddingAngle={2.5}
            cornerRadius={8}

            stroke="none"

            activeIndex={activeIndex ?? undefined}
            activeShape={renderActiveShape}

            onMouseEnter={(_, index) =>
              onActiveChange(index)
            }

            onMouseLeave={() =>
              onActiveChange(null)
            }

            label={renderLabel}

            labelLine={{
              stroke: "rgba(255,255,255,0.08)",
              strokeWidth: 1,
            }}
          >

            {data.map((entry, i) => {

              const isMax =
                entry.count === maxCount

              const isInactive =
                activeIndex !== null &&
                i !== activeIndex

              const fill = isMax
                ? "#22c55e"
                : PALETTE[i % PALETTE.length]

              return (
                <Cell
                  key={i}
                  fill={fill}
                  opacity={isInactive ? 0.22 : 1}
                  style={{
                    transition:
                      "all 220ms cubic-bezier(0.4,0,0.2,1)",

                    cursor: "pointer",

                    filter:
                      activeIndex === i
                        ? `drop-shadow(0 0 12px ${fill}90)`
                        : "none",
                  }}
                />
              )
            })}

          </Pie>

          {/* CENTER LABEL */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
          >

            <tspan
              x="50%"
              dy="-6"
              fontSize="22"
              fontWeight="800"
              fill="var(--c-text)"
            >
              {formatCount(total)}
            </tspan>

            <tspan
              x="50%"
              dy="20"
              fontSize="10"
              fontWeight="700"
              fill="var(--c-muted)"
              letterSpacing="0.12em"
            >
              TOTAL TICKET
            </tspan>

          </text>

        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})

export default ChannelDonut