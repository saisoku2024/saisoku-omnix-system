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
    <ul className="flex flex-col gap-1.5">
      {data.map((c, i) => {
        const color = c.count === maxCount ? "#10b981" : PALETTE[i % PALETTE.length]
        const isActive = activeIndex === i
        const isDim = activeIndex !== null && !isActive
        const icon = getChannelIcon(c.name)

        return (
          <li
            key={c.name}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/5 bg-slate-900/40 px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15"
            style={{
              background: isActive ? `linear-gradient(90deg, ${color}1a 0%, rgba(15,23,42,0.6) 100%)` : undefined,
              borderColor: isActive ? `${color}44` : undefined,
              boxShadow: isActive ? `0 0 16px ${color}1a` : undefined,
              opacity: isDim ? 0.4 : 1,
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-transform duration-200 group-hover:scale-105"
              style={{ background: `${color}1a`, borderColor: `${color}33`, color }}
            >
              <span className="text-sm">{icon}</span>
            </div>

            <div className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-200 group-hover:text-white">
              {c.name}
            </div>

            <div className="min-w-12 text-right text-[11px] font-black tabular-nums text-white">
              {c.count.toLocaleString("id-ID")}
            </div>

            <div
              className="min-w-12 rounded-full border px-2 py-0.5 text-center text-[10px] font-bold tabular-nums shadow-2xs"
              style={{ color, background: `${color}18`, borderColor: `${color}33` }}
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