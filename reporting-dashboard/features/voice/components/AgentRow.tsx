import React from "react"

type Props = {
  rank: number
  name: string
  value: string | number
  valueColor?: string
  suffix?: string
  isLast?: boolean
}

const MEDALS = ["🥇", "🥈", "🥉"]

export default function AgentRow({
  rank,
  name,
  value,
  valueColor,
  suffix,
  isLast,
}: Props) {
  return (
    <div
      className={`flex items-center gap-2.5 py-2.5 ${
        isLast ? "" : "border-b border-[var(--c-border)]"
      }`}
    >
      <span
        className={`w-[22px] text-center font-bold text-[var(--c-muted)] ${
          rank <= 3 ? "text-sm" : "text-[11px]"
        }`}
      >
        {rank <= 3 ? MEDALS[rank - 1] : rank}
      </span>

      <span className="flex-1 text-xs text-[var(--c-text)]">{name}</span>

      <span
        className="text-xs font-bold"
        style={{ color: valueColor ?? "var(--c-text)" }}
      >
        {value}
        {suffix}
      </span>
    </div>
  )
}