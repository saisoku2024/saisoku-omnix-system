import React from "react"
import { fmt } from "@/features/voice/utils/format"

type Props = {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  suffix?: string
}

export default function CustomTooltip({
  active,
  payload,
  label,
  suffix = "",
}: Props) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border border-(--c-border) bg-(--c-surface) px-3 py-2 text-[11px] shadow-lg">
      <div className="mb-0.5 text-(--c-muted)">{label}</div>
      <div className="font-bold text-(--c-text)">
        {fmt(payload[0].value)}
        {suffix}
      </div>
    </div>
  )
}