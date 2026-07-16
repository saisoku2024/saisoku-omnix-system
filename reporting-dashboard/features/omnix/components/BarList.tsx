import React, { useMemo } from "react"

import { PALETTE } from "@/features/omnix/constants"
import { fmt } from "@/features/omnix/utils/format"
import type { NamedCount } from "@/features/omnix/types/omnix"

type Props = {
  items: NamedCount[]
  /** Limit baris yang ditampilkan. Default 7. */
  limit?: number
}

export default function BarList({ items, limit = 7 }: Props) {
  const rows = items.slice(0, limit)

  const maxCount = useMemo(
    () => Math.max(...rows.map((item) => item.count || 0), 0),
    [rows]
  )

  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {rows.map((item, i) => {
        const pct = maxCount ? (item.count / maxCount) * 100 : 0
        const color = PALETTE[i % PALETTE.length]

        return (
          <li key={item.name}>
            <div className="mb-0.5 flex justify-between text-[10px]">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-(--c-muted)">
                {item.name}
              </span>
              <span className="ml-2 flex-shrink-0 font-bold tabular-nums text-(--c-text)">
                {fmt(item.count)}
              </span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-(--c-border)">
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