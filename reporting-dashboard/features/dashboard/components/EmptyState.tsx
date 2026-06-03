import React from "react"
import { Database } from "lucide-react"

type Props = {
  message?: string
  height?: number
}

export default function EmptyState({
  message = "Tidak ada data",
  height = 180,
}: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-[var(--c-muted)]"
      style={{ height }}
    >
      <Database size={24} strokeWidth={1.5} className="opacity-40" />
      <span className="text-xs">{message}</span>
    </div>
  )
}