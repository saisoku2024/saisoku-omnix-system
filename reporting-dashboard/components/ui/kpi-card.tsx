"use client"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

type Props = {
  title: string
  value: string
  subtitle?: string
  description?: string
  trend?: string
  trendType?: "up" | "down"
  compact?: boolean
}

export default function KpiCard({
  title,
  value,
  subtitle,
  description,
  trend,
  trendType = "up",
  compact = false,
}: Props) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b1220] border border-white/10 hover:border-white/20 transition">

      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%)] pointer-events-none" />

      <CardContent
        className={`relative ${compact ? "p-3" : "p-5"}`}
      >

        {/* HEADER */}
        <div className={`flex justify-between ${compact ? "mb-1" : "mb-4"}`}>
          <p className={`${compact ? "text-[11px]" : "text-sm"} text-gray-400`}>
            {title}
          </p>

          {trend && (
            <span
              className={`
                ${compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"}
                rounded-full border
                ${
                  trendType === "up"
                    ? "text-green-400 border-green-500/30"
                    : "text-red-400 border-red-500/30"
                }
              `}
            >
              {trend}
            </span>
          )}
        </div>

        {/* VALUE */}
        <h2
          className={`
            ${compact ? "text-lg" : "text-3xl"}
            font-semibold text-white
            ${compact ? "" : "mb-3"}
          `}
        >
          {value}
        </h2>

        {/* TEXT (ONLY NON-COMPACT) */}
        {!compact && subtitle && (
          <p className="text-sm text-white font-medium mb-1">
            {subtitle}
          </p>
        )}

        {!compact && description && (
          <p className="text-sm text-gray-400">
            {description}
          </p>
        )}

      </CardContent>
    </Card>
  )
}