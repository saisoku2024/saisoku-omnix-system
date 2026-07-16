import React from "react"
import Skeleton from "@/components/ui/skeleton"

export default function AgentRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--c-border)] py-2.5">
      <Skeleton w={22} h={14} />
      <div className="flex-1">
        <Skeleton w="60%" h={12} />
      </div>
      <Skeleton w={50} h={12} />
    </div>
  )
}
