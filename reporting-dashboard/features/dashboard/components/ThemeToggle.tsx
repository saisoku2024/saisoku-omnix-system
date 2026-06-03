"use client"

import React from "react"
import { Sun, Moon } from "lucide-react"

type Props = {
  isDark: boolean
  onToggle: () => void
}

export default function ThemeToggle({ isDark, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-[9px] border transition-all"
      style={{
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
      }}
    >
      {isDark ? <Sun size={13} /> : <Moon size={13} />}
    </button>
  )
}