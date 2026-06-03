"use client"

import React from "react"

type TooltipPayload = {
  value: number
}

type Props = {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

export default function BarTooltip({
  active,
  payload,
  label,
}: Props) {

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-white/[0.06]
        bg-[rgba(15,23,42,0.88)]
        px-3.5
        py-3
        shadow-[0_12px_30px_rgba(0,0,0,0.35)]
        backdrop-blur-xl
      "
    >

      {/* TOP ACCENT */}
      <div
        className="
          absolute
          inset-x-0
          top-0
          h-[2px]
          bg-gradient-to-r
          from-cyan-400/0
          via-cyan-400
          to-cyan-400/0
        "
      />

      {/* LABEL */}
      <div
        className="
          mb-1.5
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.12em]
          text-[var(--c-muted)]
        "
      >
        {label}
      </div>

      {/* VALUE */}
      <div className="flex items-end gap-1.5">

        <span
          className="
            text-[24px]
            font-[800]
            leading-none
            tracking-[-0.04em]
            text-cyan-400
            tabular-nums
          "
        >
          {payload[0].value}
        </span>

        <span
          className="
            pb-[2px]
            text-[11px]
            font-semibold
            text-[var(--c-muted)]
          "
        >
          tickets
        </span>

      </div>

    </div>
  )
}