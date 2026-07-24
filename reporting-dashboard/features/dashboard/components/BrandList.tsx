"use client"

import React from "react"
import { PALETTE } from "@/features/dashboard/constants"
import type { BrandItem } from "@/features/dashboard/types/dashboard"

type Props = {
  items: BrandItem[]
  limit?: number
}

const RANK_BADGES: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "rgba(245, 158, 11, 0.18)", border: "rgba(245, 158, 11, 0.4)", text: "#fbbf24" }, // Gold
  2: { bg: "rgba(148, 163, 184, 0.18)", border: "rgba(148, 163, 184, 0.4)", text: "#cbd5e1" }, // Silver
  3: { bg: "rgba(217, 119, 6, 0.18)", border: "rgba(217, 119, 6, 0.4)", text: "#f59e0b" }, // Bronze
}

export default function BrandList({ items, limit = 7 }: Props) {
  const rows = items.slice(0, limit)

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {rows.map((b, i) => {
        const color = PALETTE[i % PALETTE.length]
        const rank = i + 1
        const rankBadge = RANK_BADGES[rank]

        return (
          <li
            key={b.name}
            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-200 hover:bg-white/4"
          >
            {/* Rank Badge */}
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[9px] font-black tabular-nums shadow-2xs"
              style={
                rankBadge
                  ? { background: rankBadge.bg, borderColor: rankBadge.border, color: rankBadge.text }
                  : { background: "rgba(255, 255, 255, 0.04)", borderColor: "rgba(255, 255, 255, 0.08)", color: "#94a3b8" }
              }
            >
              {rank}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                <span title={b.name} className="min-w-0 flex-1 truncate font-medium text-slate-300 group-hover:text-white">
                  {b.name}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-slate-400">{b.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${b.pct}%`,
                    background: `linear-gradient(90deg, ${color}aa, ${color})`,
                    boxShadow: `0 0 8px ${color}66`,
                  }}
                />
              </div>
            </div>

            <span className="w-12 shrink-0 text-right text-[11px] font-extrabold tabular-nums text-white">
              {b.count.toLocaleString("id-ID")}
            </span>
          </li>
        )
      })}
    </ul>
  )
}