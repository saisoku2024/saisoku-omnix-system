"use client"

import React, { useMemo } from "react"
import { PALETTE } from "@/features/dashboard/constants"
import type { CategoryItem } from "@/features/dashboard/types/dashboard"

type Props = {
  items: CategoryItem[]
  limit?: number
}

export default function BarList({ items, limit = 7 }: Props) {
  const rows = items.slice(0, limit)
  const maxCount = useMemo(() => Math.max(...rows.map((item) => item.count || 0), 0), [rows])

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {rows.map((item, i) => {
        const pct = maxCount ? (item.count / maxCount) * 100 : 0
        const color = PALETTE[i % PALETTE.length]

        return (
          <li
            key={item.name}
            className="group flex flex-col gap-1 rounded-lg px-2 py-1.5 transition-all duration-200 hover:bg-white/4 hover:shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span
                title={item.name}
                className="min-w-0 flex-1 truncate font-medium text-slate-300 transition-colors group-hover:text-white"
              >
                {item.name}
              </span>
              <span className="shrink-0 font-extrabold tabular-nums text-white">
                {item.count.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}aa, ${color})`,
                  boxShadow: `0 0 8px ${color}88`,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}