import React from "react"

export default function DonutSkeleton() {
  return (
    <div className="flex h-37.5 items-center justify-center">
      <div
        className="shimmer-circle h-31 w-31 rounded-full"
        style={{
          mask: "radial-gradient(circle, transparent 38%, black 39%)",
          WebkitMask: "radial-gradient(circle, transparent 38%, black 39%)",
        }}
      />
    </div>
  )
}