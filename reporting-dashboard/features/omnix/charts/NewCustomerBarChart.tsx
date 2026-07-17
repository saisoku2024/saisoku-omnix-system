"use client"

import React, { memo } from "react"
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

import type { CustomerData } from "@/features/omnix/types/omnix"
import CustomTooltip from "@/features/omnix/charts/CustomTooltip"

type Props = {
  data: CustomerData[]
  gridColor: string
  tickColor: string
  isDark: boolean
  highlightedMonths?: string[] // SIVA FIX: Wajib ditambahkan
}

const NewCustomerBarChart = memo(function NewCustomerBarChart({
  data,
  gridColor,
  tickColor,
  isDark,
  highlightedMonths = [],
}: Props) {
  const peakColor = "#22c55e"
  // SIVA FIX: Warna dim dibuat lebih pudar
  const dimColor = isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.25)"
  
  // Jika array kosong (artinya filter Tahun aktif), maka highlight SEMUA bulan
  const isHighlightAll = highlightedMonths.length === 0

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
        <BarChart
          data={data}
          margin={{ top: 22, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="30%"
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
            width={32}
            tick={{ fill: tickColor, fontSize: 10 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.04)",
            }}
          />
          <Bar
            dataKey="new"
            name="New Customer"
            radius={[5, 5, 0, 0]}
            maxBarSize={30}
            isAnimationActive={false}
          >
            {data.map((entry, i) => {
              // SIVA FIX: Logika penentuan warna
              const labelStr = String(entry.label).trim()
              const isHighlighted = isHighlightAll || highlightedMonths.includes(labelStr)
              
              return (
                <Cell
                  key={i}
                  fill={isHighlighted ? peakColor : dimColor}
                  stroke={isHighlighted ? peakColor : "none"}
                  strokeWidth={isHighlighted ? 1 : 0}
                />
              )
            })}
            <LabelList
              dataKey="new"
              position="top"
              style={{ fontSize: 9, fontWeight: 600, fill: tickColor }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export default NewCustomerBarChart
