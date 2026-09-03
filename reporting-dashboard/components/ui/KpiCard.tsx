"use client"

import React, { memo, useEffect, useRef } from "react"
import type { LucideIcon } from "lucide-react"
import { animate } from "animejs"
import Card from "@/components/ui/card"
import Skeleton from "@/components/ui/skeleton"
import AnimatedNumber from "@/components/ui/AnimatedNumber"

export type KpiCardProps = {
  label: string
  value: string
  rawValue?: number
  Icon: LucideIcon
  color: string
  loading: boolean
}

const EMPTY_VALUES = new Set(["–", "-", "NaN", ""])
function isEmpty(value: string): boolean {
  return !value || EMPTY_VALUES.has(value.trim())
}

function calculateTargetProgress(value: string, empty: boolean, loading: boolean): number {
  if (loading || empty) return 0
  const str = String(value).trim()

  // If percentage (e.g. 95.4%)
  const pctMatch = str.match(/^([0-9.,]+)%$/)
  if (pctMatch) {
    const num = parseFloat(pctMatch[1].replace(/,/g, ""))
    return Math.min(100, Math.max(5, num))
  }

  // If CSAT out of 5 (e.g. 4.8 or 4.8 / 5)
  const csatMatch = str.match(/^([0-9.]+)(?:\s*\/\s*5)?$/)
  if (csatMatch) {
    const num = parseFloat(csatMatch[1])
    if (num <= 5 && num > 0) {
      return Math.min(100, (num / 5) * 100)
    }
  }

  // Default active indicator width for count values
  return 75
}

function KpiCard({ label, value, Icon, color, loading }: KpiCardProps) {
  const empty = !loading && isEmpty(value)
  const barRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  // Anime.js powered progress bar width animation
  useEffect(() => {
    if (!barRef.current) return
    const targetWidth = calculateTargetProgress(value, empty, loading)
    
    const progressObj = { width: 0 }
    const anim = animate(progressObj, {
      width: targetWidth,
      duration: 1000,
      ease: "outExpo",
      onUpdate: () => {
        if (barRef.current) {
          barRef.current.style.width = `${progressObj.width}%`
        }
      },
    })

    return () => {
      try {
        anim.revert?.()
      } catch {}
    }
  }, [value, empty, loading])

  // Micro-interaction on hover using Anime.js
  const handleMouseEnter = () => {
    if (iconRef.current) {
      animate(iconRef.current, {
        scale: 1.14,
        rotate: [0, -6, 6, 0],
        duration: 400,
        ease: "outBack(overshoot = 1.7)",
      })
    }
  }

  const handleMouseLeave = () => {
    if (iconRef.current) {
      animate(iconRef.current, {
        scale: 1,
        rotate: 0,
        duration: 300,
        ease: "outQuad",
      })
    }
  }

  return (
    <Card variant="premium" size="sm" className="h-full">
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 p-3.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_14px_32px_rgba(0,0,0,0.45)]"
        style={{
          backgroundImage: `radial-gradient(ellipse at 85% 15%, ${color}1e 0%, transparent 65%)`,
        }}
      >
        {/* UI.live Top Accent Stroke */}
        <div
          className="absolute inset-x-0 top-0 h-[1.5px] opacity-75 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />

        {/* Ambient Corner Glow */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40"
          style={{ background: color }}
        />

        <div className="relative z-10 flex flex-col gap-2">
          {/* Header Row: Micro Label + Icon Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 group-hover:text-slate-200 transition-colors">
              {label}
            </span>
            <div
              ref={iconRef}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-xs"
              style={{
                background: `${color}18`,
                borderColor: `${color}38`,
                boxShadow: `0 0 14px ${color}20`,
              }}
            >
              <Icon size={14} color={color} strokeWidth={2.4} opacity={1} />
            </div>
          </div>

          {/* Metric Value with Anime.js Animated Count-up */}
          {loading ? (
            <Skeleton w={70} h={24} />
          ) : (
            <div className="font-heading text-[21px] font-extrabold leading-none tracking-tight tabular-nums text-white group-hover:text-white drop-shadow-xs">
              <AnimatedNumber value={value || "0"} duration={950} />
            </div>
          )}
        </div>

        {/* Anime.js Progress Gauge Bar */}
        <div className="relative z-10 mt-3.5 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            ref={barRef}
            className="h-full rounded-full"
            style={{
              width: "0%",
              background: `linear-gradient(90deg, ${color}99, ${color})`,
              boxShadow: `0 0 10px ${color}bb`,
            }}
          />
        </div>
      </div>
    </Card>
  )
}

export default memo(KpiCard)
