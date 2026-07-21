import * as React from "react"
import { cn } from "@/lib/utils"

type SkeletonProps = React.ComponentProps<"div"> & {
  w?: number | string
  h?: number | string
}

function Skeleton({ className, style, w, h, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      style={{ width: w, height: h, ...style }}
      {...props}
    />
  )
}

export { Skeleton }
export default Skeleton
