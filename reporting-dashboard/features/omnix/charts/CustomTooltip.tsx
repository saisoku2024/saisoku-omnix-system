import React from "react"
import { fmt } from "@/features/omnix/utils/format"

interface TooltipPayload {
  dataKey?: string
  name?: string
  value: number
  fill?: string
  color?: string
}

type Props = {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

export default function CustomTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-[140px] rounded-[10px] border border-(--c-border) bg-(--c-surface) px-3.5 py-2.5 shadow-lg">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-(--c-muted)">
        {label}
      </p>

      {payload.map((p, idx) => (
        <div
          key={p.dataKey ?? idx}
          className="flex items-center gap-2 py-0.5"
        >
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ background: p.fill ?? p.color }}
          />
          <span className="text-[11px] text-(--c-muted)">{p.name}</span>
          <span className="ml-auto pl-3 text-[11px] font-bold text-(--c-text)">
            {typeof p.value === "number" ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}