import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  w,
  h,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  w?: number | string
  h?: number | string
}) {
  const customStyle: React.CSSProperties = {
    ...(w !== undefined ? { width: w } : {}),
    ...(h !== undefined ? { height: h } : {}),
    ...(w !== undefined || h !== undefined ? { background: "var(--c-skeleton)", animation: "pulse 1.5s ease-in-out infinite", borderRadius: 6 } : {}),
    ...style,
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        w === undefined && h === undefined ? "animate-pulse rounded-md bg-muted" : "",
        className
      )}
      style={customStyle}
      {...props}
    />
  )
}

export { Skeleton }
export default Skeleton
