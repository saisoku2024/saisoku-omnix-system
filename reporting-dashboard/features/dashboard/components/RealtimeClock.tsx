"use client"

import React, { useEffect, useState } from "react"

export default function RealtimeClock() {
  const [time, setTime] = useState("")

  useEffect(() => {
    const updateClock = () => setTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col leading-none">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--c-muted)]">Local Time</span>
      <span className="mt-1 text-[15px] font-[extrabold] tracking-[-0.03em] text-(--c-text)] tabular-nums">{time} WIB</span>
    </div>
  )
}