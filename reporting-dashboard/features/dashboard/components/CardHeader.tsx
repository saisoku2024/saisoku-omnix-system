import React from "react"

type Props = {
  title: string
  badge?: string
}

export default function CardHeader({ title, badge }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--c-border)] px-4 py-3">
      <span className="text-xs font-bold tracking-wide text-[var(--c-text)]">
        {title}
      </span>

      {badge && (
        <span className="rounded-full bg-[rgba(14,165,233,0.12)] px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider text-[#0ea5e9]">
          {badge}
        </span>
      )}
    </div>
  )
}