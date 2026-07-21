import React from "react"

type Props = {
  title: string
  badge?: string
  extra?: React.ReactNode
}

export default function CardHeader({ title, badge, extra }: Props) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-2 border-b border-(--c-border) px-4 py-3">
      <span className="text-xs font-bold tracking-wide text-(--c-text)">
        {title}
      </span>

      <div className="flex items-center gap-2">
        {extra}
        {badge && (
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider text-green-500">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
