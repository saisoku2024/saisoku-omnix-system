import React from "react"
import { PALETTE } from "@/features/dashboard/constants"
import type { BrandItem } from "@/features/dashboard/types/dashboard"

type Props = {
  items: BrandItem[]
  limit?: number
}

export default function BrandList({ items, limit = 7 }: Props) {
  const rows = items.slice(0, limit)

  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {rows.map((b, i) => {
        const color = PALETTE[i % PALETTE.length]

        return (
          <li key={b.name} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-center text-[9px] font-extrabold tabular-nums text-(--c-muted)">
              {i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                <span title={b.name} className="min-w-0 flex-1 truncate text-(--c-text)">
                  {b.name}
                </span>
                <span className="shrink-0 tabular-nums text-(--c-muted)">{b.pct}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-(--c-border)">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${b.pct}%`, background: color }}
                />
              </div>
            </div>

            <span className="w-10 shrink-0 text-right text-[10px] font-bold tabular-nums text-(--c-text)">
              {b.count.toLocaleString()}
            </span>
          </li>
        )
      })}
    </ul>
  )
}