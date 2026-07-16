import React from "react"

import { fmt } from "@/features/omnix/utils/format"
import type { TopCase } from "@/features/omnix/types/omnix"

type Props = {
  data: TopCase[]
}

export default function TopCasesTable({ data }: Props) {
  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-[32px_1fr_90px_70px] items-center gap-3 border-b border-(--c-border) px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-(--c-muted)">
        <span>#</span>
        <span>Case</span>
        <span className="text-center">Channel</span>
        <span className="text-right">Count</span>
      </div>

      {/* Rows */}
      {data.slice(0, 5).map((row) => (
        <div
          key={row.rank}
          className="grid grid-cols-[32px_1fr_90px_70px] items-center gap-3 border-b border-(--c-border) px-1 py-2.5 last:border-b-0"
        >
          <span className="text-xs font-bold text-(--c-muted)">
            {row.rank}
          </span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-(--c-text)">
            {row.title}
          </span>
          <span className="text-center text-[10px] text-(--c-muted)">
            {row.channel}
          </span>
          <span className="text-right text-xs font-bold tabular-nums text-(--c-text)">
            {fmt(row.count)}
          </span>
        </div>
      ))}
    </div>
  )
}