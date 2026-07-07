"use client"

import React from "react"
import type { LucideIcon } from "lucide-react"
import Card from "@/shared/ui/Card"
import Skeleton from "@/shared/ui/Skeleton"

type Props = {
  label: string
  value: string
  Icon: LucideIcon
  color: string
  loading: boolean
}

const EMPTY_VALUES = new Set(["–", "-", "0", "0%", "0s", "0m", "0m 0s", "NaN", ""])
function isEmpty(value: string): boolean {
  return EMPTY_VALUES.has(value.trim())
}

export default function KpiCard({ label, value, Icon, color, loading }: Props) {
  const empty = !loading && isEmpty(value)

  return (
    <Card>
      <div className="group relative overflow-hidden rounded-xl border border-white/3 bg-linear-to-b from-white/2 to-transparent px-3 py-2 transition-all duration-300">
        <div
          className="absolute inset-x-0 top-0 h-[0.5] opacity-80"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        <div className="relative flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-(--c-muted)">
              {label}
            </span>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
              style={{ background: `${color}14`, borderColor: `${color}22` }}
            >
              <Icon size={12} color={color} strokeWidth={2.2} opacity={empty ? 0.45 : 1} />
            </div>
          </div>

          {loading ? (
            <Skeleton w={60} h={18} />
          ) : (
            <span
              className="text-[17px] font-extrabold leading-none tracking-[-0.03em] tabular-nums"
              style={{ color: empty ? "var(--c-muted)" : "var(--c-text)" }}
            >
              {value}
            </span>
          )}

          <div className="mt-0.5 h-[0.5] overflow-hidden rounded-full" style={{ background: `${color}14` }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: loading || empty ? "0%" : "68%", background: color }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}