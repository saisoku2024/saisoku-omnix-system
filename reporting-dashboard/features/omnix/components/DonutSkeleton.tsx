import React from "react"

export default function DonutSkeleton() {
  return (
    <div className="flex h-[150px] items-center justify-center">
      <div
        className="shimmer-circle h-[124px] w-[124px] rounded-full"
        style={{
          mask: "radial-gradient(circle, transparent 38%, black 39%)",
          WebkitMask: "radial-gradient(circle, transparent 38%, black 39%)",
        }}
      />
    </div>
  )
}