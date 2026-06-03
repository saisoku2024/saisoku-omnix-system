import React from "react"

import Skeleton from "@/shared/ui/Skeleton"

type Props = { rows?: number }

export default function BarListSkeleton({ rows = 6 }: Props) {
  return (
    <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <div className="mb-1.5 flex justify-between">
            <Skeleton w={`${50 + ((i * 7) % 30)}%`} h={11} />
            <Skeleton w={32} h={11} />
          </div>
          <Skeleton w="100%" h={5} />
        </li>
      ))}
    </ul>
  )
}