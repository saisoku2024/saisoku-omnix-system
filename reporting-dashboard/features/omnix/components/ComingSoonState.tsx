import React from "react"
import { Sparkles } from "lucide-react"

type Props = {
  message?: string
  hint?: string
}

export default function ComingSoonState({
  message = "Coming Soon",
  hint = "Data belum tersedia",
}: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-10 text-[var(--c-muted)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--c-accent)]/10">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[var(--c-accent)] opacity-80"
        />
      </div>
      <span className="text-[13px] font-semibold text-[var(--c-text)]">
        {message}
      </span>
      <span className="text-[11px] text-[var(--c-muted)]">{hint}</span>
    </div>
  )
}