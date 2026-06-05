import React, { useMemo } from "react"

import { PALETTE } from "@/features/dashboard/constants"
import type { CategoryItem } from "@/features/dashboard/types/dashboard"

type Props = {
  items: CategoryItem[]
  limit?: number
}

export default function BarList({ items, limit = 7 }: Props) {
  const rows = items.slice(0, limit)

  const maxCount = useMemo(
    () => Math.max(...rows.map((item) => item.count || 0), 0),
    [rows]
  )

  return (
    <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
      {rows.map((item, i) => {
        const pct = maxCount ? (item.count / maxCount) * 100 : 0
        const color = PALETTE[i % PALETTE.length]

        return (
          <li key={item.name}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span
                title={item.name}
                className="
                  min-w-0
                  flex-1
                  truncate
                  text-(--c-muted)]
                "
              >
                {item.name}
              </span>

              <span
                className="
                  shrink-0
                  font-bold
                  tabular-nums
                  text-(--c-text)]
                "
              >
                {item.count.toLocaleString()}
              </span>
            </div>

            <div className="h-1.25 overflow-hidden rounded-full bg-(--c-border)]">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  background: color,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}