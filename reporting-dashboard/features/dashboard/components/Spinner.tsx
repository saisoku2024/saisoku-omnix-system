import React from "react"

type Props = {
  height?: number
}

export default function Spinner({ height = 220 }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2.5 text-xs text-[var(--c-muted)]"
      style={{ height }}
    >
      <div className="h-5 w-5 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-[#0ea5e9] border-t-transparent" />
      Memuat…
    </div>
  )
}