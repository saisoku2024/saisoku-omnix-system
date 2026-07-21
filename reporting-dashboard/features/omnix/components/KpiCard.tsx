import React from "react"
import type { LucideIcon } from "lucide-react"

import Card from "@/components/ui/card"
import Skeleton from "@/components/ui/skeleton"

type Props = {
  label: string
  value: string
  color: string
  Icon: LucideIcon
  loading: boolean
  rawValue?: number
}

const EMPTY_STRING_VALUES = new Set(["0", "0s", "0m", "0m 0s", "0m 00s", ""])

function isEmpty(value: string, rawValue?: number): boolean {
  if (typeof rawValue === "number") return rawValue === 0
  return EMPTY_STRING_VALUES.has(value.trim())
}

export default function KpiCard({
  label,
  value,
  color,
  Icon,
  loading,
  rawValue,
}: Props) {
  const empty = !loading && isEmpty(value, rawValue)

  return (
    <Card>
      <div className="flex flex-col gap-[11px] px-4 py-3.5">
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-bold uppercase leading-[1.5] tracking-wider text-[var(--c-muted)]">
            {label}
          </span>

          <span
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${color}18` }}
          >
            <Icon
              size={13}
              color={color}
              strokeWidth={2.2}
              opacity={empty ? 0.4 : 1}
            />
          </span>
        </div>

        {loading ? (
          <Skeleton w={70} h={24} />
        ) : (
          <span
            className="text-[22px] font-bold leading-none tabular-nums tracking-tight"
            style={{ color: empty ? "var(--c-muted)" : "var(--c-text)" }}
          >
            {value}
          </span>
        )}

        <div
          className="h-0.5 overflow-hidden rounded-full"
          style={{ background: `${color}20` }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{
              width: loading || empty ? "0%" : "60%",
              background: color,
            }}
          />
        </div>
      </div>
    </Card>
  )
}