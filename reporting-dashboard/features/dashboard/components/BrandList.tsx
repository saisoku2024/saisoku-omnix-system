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
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((b, i) => {
        const color = PALETTE[i % PALETTE.length]

        return (
          <li key={b.name} className="flex items-center gap-2.5">
            <span className="w-4 flex-shrink-0 text-center text-[10px] font-extrabold tabular-nums text-[var(--c-muted)]">
              {i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[var(--c-text)]">
                  {b.name}
                </span>
                <span className="ml-1.5 flex-shrink-0 tabular-nums text-[var(--c-muted)]">
                  {b.pct}%
                </span>
              </div>

              <div className="h-1 overflow-hidden rounded-full bg-[var(--c-border)]">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${b.pct}%`,
                    background: color,
                  }}
                />
              </div>
            </div>

            <span className="w-9 flex-shrink-0 text-right text-[11px] font-bold tabular-nums text-[var(--c-text)]">
              {b.count.toLocaleString()}
            </span>
          </li>
        )
      })}
    </ul>
  )
}