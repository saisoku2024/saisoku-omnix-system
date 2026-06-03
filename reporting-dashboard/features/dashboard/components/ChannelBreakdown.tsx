"use client"

import React, { useMemo, useState } from "react"

import { PALETTE } from "@/features/dashboard/constants"
import { getChannelIcon } from "@/features/dashboard/data/channelIcons"
import type { PieItemWithPct } from "@/features/dashboard/types/dashboard"

type Props = {
  data: PieItemWithPct[]
}

export default function ChannelBreakdown({
  data,
}: Props) {

  const [activeIndex, setActiveIndex] =
    useState<number | null>(null)

  const maxCount = useMemo(
    () => Math.max(...data.map((c) => c.count), 0),
    [data]
  )

  return (
    <div className="flex h-full flex-col justify-center">

      <ul
        className="
          flex
          flex-col
          gap-1
        "
      >

        {data.map((c, i) => {

          const color =
            c.count === maxCount
              ? "#22c55e"
              : PALETTE[i % PALETTE.length]

          const isActive =
            activeIndex === i

          const isDim =
            activeIndex !== null &&
            !isActive

          const icon =
            getChannelIcon(c.name)

          return (
            <li
              key={c.name}

              onMouseEnter={() =>
                setActiveIndex(i)
              }

              onMouseLeave={() =>
                setActiveIndex(null)
              }

              className="
                group
                relative
                flex
                cursor-pointer
                items-center
                gap-2
                overflow-hidden
                rounded-xl
                border
                px-2.5
                py-1.5
                transition-all
                duration-200
              "

              style={{
                background: isActive
                  ? `${color}10`
                  : "transparent",

                borderColor: isActive
                  ? `${color}22`
                  : "transparent",

                opacity: isDim ? 0.3 : 1,

                boxShadow: isActive
                  ? `0 0 18px ${color}18`
                  : "none",
              }}
            >

              {/* LEFT GLOW */}
              <div
                className="
                  absolute
                  left-0
                  top-0
                  h-full
                  w-0,5
                  rounded-full
                  opacity-0
                  transition-opacity
                  duration-200
                "
                style={{
                  background: color,
                  opacity: isActive ? 1 : 0,
                }}
              />

              {/* ICON */}
              <div
                className="
                  relative
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  transition-all
                  duration-200
                "
                style={{
                  background: `${color}14`,
                  borderColor: `${color}24`,
                  color,
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
                    duration-200
                    group-hover:opacity-100
                  "
                  style={{
                    background: color,
                  }}
                />

                <span className="relative z-10">
                  {icon}
                </span>

              </div>

              {/* NAME */}
              <div className="min-w-0 flex-1">

                <div
                  className="
                    overflow-hidden
                    text-ellipsis
                    whitespace-nowrap
                    text-[11px]
                    font-semibold
                    text-(--c-text)]
                  "
                >
                  {c.name}
                </div>

              </div>

              {/* COUNT */}
              <div
                className="
                  min-w-13
                  text-right
                  text-[11px]
                  font-extrabold
                  tabular-nums
                  text---c-text)]
                "
              >
                {c.count.toLocaleString("id-ID")}
              </div>

              {/* PERCENT */}
              <div
                className="
                  min-w-12
                  rounded-full
                  border
                  px-2
                  py-0,5
                  text-center
                  text-[9px]
                  font-bold
                  tabular-nums
                "
                style={{
                  color,
                  background: `${color}12`,
                  borderColor: `${color}22`,
                }}
              >
                {Number(c.pct).toFixed(1)}%
              </div>

            </li>
          )
        })}

      </ul>

    </div>
  )
}