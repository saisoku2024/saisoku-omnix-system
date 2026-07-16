"use client"

import React, { useMemo, useState } from "react"

import { PALETTE } from "@/features/omnix/constants"
import { fmt } from "@/features/omnix/utils/format"
import type { NamedCount } from "@/features/omnix/types/omnix"

import ChannelDonut from "@/features/omnix/charts/ChannelDonut"

type Props = {
  data: NamedCount[]
}

export default function ChannelBreakdown({ data }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const total = useMemo(
    () => data.reduce((s, c) => s + (c.count || 0), 0),
    [data]
  )

  const pieData = useMemo(
    () =>
      data.map((c) => ({
        ...c,
        pct: total ? Math.round((c.count / total) * 100) : 0,
      })),
    [data, total]
  )

  return (
    <>
      <ChannelDonut
        data={pieData}
        total={total}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
      />

      <ul className="m-0 mt-2 flex list-none flex-col gap-[1px] p-0">
        {pieData.map((c, i) => {
          const color = PALETTE[i % PALETTE.length]
          const isActive = activeIndex === i
          const isDimmed = activeIndex !== null && !isActive

          return (
            <li
              key={c.name}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-all"
              style={{
                background: isActive ? `${color}12` : "transparent",
                opacity: isDimmed ? 0.4 : 1,
              }}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: color }}
              />

              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-(--c-text)">
                {c.name}
              </span>

              <span className="text-[11px] font-bold tabular-nums text-(--c-text)">
                {fmt(c.count || 0)}
              </span>

              <span
                className="min-w-[30px] text-right text-[11px] font-bold"
                style={{ color }}
              >
                {c.pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}