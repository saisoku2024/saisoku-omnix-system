import React from "react"
import { Database } from "lucide-react"

export default function EmptyState({
  message = "No data available",
}: {
  message?: string
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-10 text-(--c-muted)">
      <Database size={32} strokeWidth={1.5} className="opacity-50" />
      <span className="text-[13px] font-medium">{message}</span>
    </div>
  )
}