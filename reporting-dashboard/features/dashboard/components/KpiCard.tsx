"use client"

import React, { memo } from "react"
import type { LucideIcon } from "lucide-react"
import Card from "@/components/ui/card"
import Skeleton from "@/components/ui/skeleton"

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

function KpiCard({ label, value, Icon, color, loading }: Props) {
  const empty = !loading && isEmpty(value)

  return (
    <Card variant="premium" size="sm" className="h-full">
      <div
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/8 bg-slate-900/60 p-3.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
        style={{
          backgroundImage: `radial-gradient(ellipse at 85% 15%, ${color}1a 0%, transparent 65%)`,
        }}
      >
        {/* Top glowing accent border */}
        <div
          className="absolute inset-x-0 top-0 h-[1.5px] opacity-80 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        <div className="relative flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {label}
            </span>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `${color}18`,
                borderColor: `${color}33`,
                boxShadow: `0 0 12px ${color}1a`,
              }}
            >
              <Icon size={14} color={color} strokeWidth={2.4} opacity={empty ? 0.5 : 1} />
            </div>
          </div>

          {loading ? (
            <Skeleton w={70} h={24} />
          ) : (
            <span
              className="font-heading text-[20px] font-extrabold leading-none tracking-tight tabular-nums"
              style={{ color: empty ? "var(--c-muted)" : "#ffffff" }}
            >
              {value}
            </span>
          )}
        </div>

        {/* Ambient progress indicator */}
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: loading || empty ? "0%" : "72%",
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}aa`,
            }}
          />
        </div>
      </div>
    </Card>
  )
}

export default memo(KpiCard)
