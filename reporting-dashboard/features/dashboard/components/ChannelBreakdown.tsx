"use client"

import React, { useMemo, useState, memo } from "react"
import { PALETTE } from "@/features/dashboard/constants"
import { getChannelIcon } from "@/features/dashboard/data/channelIcons"
import type { PieItemWithPct } from "@/features/dashboard/types/dashboard"

type Props = {
  data: PieItemWithPct[]
}

function ChannelBreakdown({ data }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const maxCount = useMemo(() => Math.max(...data.map((c) => c.count), 0), [data])

  return (
    <ul className="flex flex-col gap-1">
      {data.map((c, i) => {
        const color = c.count === maxCount ? "#22c55e" : PALETTE[i % PALETTE.length]
        const isActive = activeIndex === i
        const isDim = activeIndex !== null && !isActive
        const icon = getChannelIcon(c.name)

        return (
          <li
            key={c.name}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            className="group flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1 transition-all duration-200"
            style={{
              background: isActive ? `${color}10` : "transparent",
              borderColor: isActive ? `${color}22` : "transparent",
              opacity: isDim ? 0.3 : 1,
            }}
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
              style={{ background: `${color}14`, borderColor: `${color}24`, color }}
            >
              <span className="text-xs">{icon}</span>
            </div>

            <div className="min-w-0 flex-1 truncate text-[10px] font-semibold text-(--c-text)">
              {c.name}
            </div>

            <div className="min-w-11 text-right text-[10px] font-extrabold tabular-nums text-(--c-text)">
              {c.count.toLocaleString("id-ID")}
            </div>

            <div
              className="min-w-11 rounded-full border px-1.5 py-0.5 text-center text-[9px] font-bold tabular-nums"
              style={{ color, background: `${color}12`, borderColor: `${color}22` }}
            >
              {Number(c.pct).toFixed(1)}%
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default memo(ChannelBreakdown)