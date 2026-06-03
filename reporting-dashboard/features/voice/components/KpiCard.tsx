import React from "react"
import type { LucideIcon } from "lucide-react"

import Card from "@/shared/ui/Card"
import Skeleton from "@/shared/ui/Skeleton"

type Props = {
  label: string
  value: string
  color: string
  Icon: LucideIcon
  loading: boolean
  /**
   * Optional: nilai numerik mentah untuk menentukan apakah data kosong.
   * Kalau tidak di-pass, fallback ke pengecekan string "0" / "0%" / "0m 0s".
   */
  rawValue?: number
}

const EMPTY_STRING_VALUES = new Set(["0", "0%", "0m 0s", "0m 00s", ""])

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
      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--c-muted)]">
            {label}
          </span>
          <Icon
            size={14}
            color={color}
            opacity={empty ? 0.4 : 1}
          />
        </div>

        {loading ? (
          <Skeleton w={70} h={24} />
        ) : (
          <span
            className="text-[22px] font-bold"
            style={{ color: empty ? "var(--c-muted)" : undefined }}
          >
            {value}
          </span>
        )}

        <div
          className="h-0.5 overflow-hidden rounded-full"
          style={{ background: `${color}20` }}
        >
          <div
            className="h-full transition-[width] duration-1000 ease-out"
            style={{
              width: loading || empty ? "0%" : "100%",
              background: color,
            }}
          />
        </div>
      </div>
    </Card>
  )
}