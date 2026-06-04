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

const EMPTY_VALUES = new Set([
  "–",
  "-",
  "0",
  "0%",
  "0s",
  "0m",
  "0m 0s",
  "NaN",
  "",
])

function isEmpty(value: string): boolean {
  return EMPTY_VALUES.has(value.trim())
}

export default function KpiCard({
  label,
  value,
  Icon,
  color,
  loading,
}: Props) {

  const empty = !loading && isEmpty(value)

  return (
    <Card>
      <div
        className="
          group
          relative
          overflow-hidden
          rounded-[18px]
          border border-white/[0.03]
          bg-gradient-to-b
          from-white/[0.02]
          to-transparent
          px-4
          py-2.5
          transition-all
          duration-300
          hover:-translate-y-[2px]
          hover:border-white/[0.06]
        "
      >
        {/* TOP GLOW */}
        <div
          className="
            absolute
            inset-x-0
            top-0
            h-[2px]
            opacity-80
          "
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />

        {/* BACKGROUND BLUR */}
        <div
          className="
            absolute
            right-[-30px]
            top-[-30px]
            h-[90px]
            w-[90px]
            rounded-full
            blur-3xl
            opacity-10
          "
          style={{
            background: color,
          }}
        />

        <div className="relative flex flex-col gap-[8px]">

          {/* HEADER */}
          <div className="flex items-start justify-between gap-2">

            <span
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-[var(--c-muted)]
              "
            >
              {label}
            </span>

            <div
              className="
                relative
                flex
                h-7
                w-7
                flex-shrink-0
                items-center
                justify-center
                rounded-xl
                border
                transition-all
                duration-300
                group-hover:scale-105
              "
              style={{
                background: `${color}14`,
                borderColor: `${color}22`,
                boxShadow: `0 0 24px ${color}20`,
              }}
            >
              <div
                className="
                  absolute
                  inset-0
                  rounded-xl
                  opacity-0
                  blur-xl
                  transition-opacity
                  duration-300
                  group-hover:opacity-100
                "
                style={{
                  background: color,
                }}
              />

              <Icon
                size={14}
                color={color}
                strokeWidth={2.2}
                opacity={empty ? 0.45 : 1}
                className="relative z-10"
              />

            </div>
          </div>

          {/* VALUE */}
          {loading ? (
            <Skeleton w={80} h={28} />
          ) : (
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                <span
                  className="
                    text-[24px]
                    font-[800]
                    leading-none
                    tracking-[-0.04em]
                    tabular-nums
                  "
                  style={{
                    color: empty
                      ? "var(--c-muted)"
                      : "var(--c-text)",
                  }}
                >
                  {value}
                </span>
              </div>
            </div>
          )}

          {/* ACCENT BAR */}
          <div
            className="
              mt-[2px]
              h-[3px]
              overflow-hidden
              rounded-full
            "
            style={{
              background: `${color}14`,
            }}
          >
            <div
              className="
                h-full
                rounded-full
                transition-all
                duration-1000
                ease-out
              "
              style={{
                width: loading || empty ? "0%" : "68%",
                background: `linear-gradient(90deg, ${color}, ${color}99)`,
                boxShadow: `0 0 18px ${color}66`,
              }}
            />
          </div>

        </div>
      </div>
    </Card>
  )
}