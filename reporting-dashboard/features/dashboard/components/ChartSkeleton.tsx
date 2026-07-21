"use client"

import React, { useMemo } from "react"

type Props = {
  bars?: number
  showYAxis?: boolean
}

export default function ChartSkeleton({ bars = 12, showYAxis = true }: Props) {
  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const base = 50 + Math.sin(i * 0.5) * 25 + Math.cos(i * 0.3) * 15
        return Math.max(25, Math.min(95, Math.round(base + 25)))
      }),
    [bars]
  )

  const gap = bars > 20 ? "gap-[3px]" : "gap-1.5"

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div
        className={`relative flex flex-1 items-end ${gap} ${
          showYAxis ? "pl-8" : ""
        } pr-2 pt-2`}
      >
        {showYAxis && (
          <div className="absolute bottom-0 left-0 top-2 flex w-[26px] flex-col items-end justify-between pr-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1.5 w-[18px] rounded-[3px] bg-(--c-skeleton) opacity-50"
              />
            ))}
          </div>
        )}

        {heights.map((h, i) => (
          <div
            key={i}
            className="shimmer-bar flex-1 rounded-t"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 0.04}s, ${i * 0.06}s`,
            }}
          />
        ))}
      </div>

      <div className={`flex ${gap} ${showYAxis ? "pl-8" : ""} pr-2`}>
        {heights.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-[3px] bg-(--c-skeleton) opacity-40"
          />
        ))}
      </div>
    </div>
  )
}