"use client"

import React, { useEffect, useRef } from "react"
import { animate, type JSAnimation } from "animejs"

type Props = {
  value: string | number
  duration?: number
  className?: string
}

function parseFormattedValue(raw: string | number): {
  type: "time" | "percent" | "number" | "raw"
  num: number
  prefix: string
  suffix: string
  decimals: number
  rawText: string
} {
  const str = String(raw).trim()

  if (!str || str === "-" || str === "–" || str === "NaN" || str === "N/A") {
    return { type: "raw", num: 0, prefix: "", suffix: "", decimals: 0, rawText: str }
  }

  // Time format: mm:ss or hh:mm:ss
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(":").map(Number)
    let totalSec = 0
    if (parts.length === 2) {
      totalSec = parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return {
      type: "time",
      num: totalSec,
      prefix: "",
      suffix: "",
      decimals: 0,
      rawText: str,
    }
  }

  // Percentage format, e.g. "98.5%" or "+12.4%"
  const percentMatch = str.match(/^([+-]?)([0-9.,]+)%$/)
  if (percentMatch) {
    const prefix = percentMatch[1]
    const cleanNumStr = percentMatch[2].replace(/,/g, "")
    const num = parseFloat(cleanNumStr)
    const decimals = (cleanNumStr.split(".")[1] || "").length
    return {
      type: "percent",
      num: isNaN(num) ? 0 : num,
      prefix,
      suffix: "%",
      decimals: Math.min(decimals, 2),
      rawText: str,
    }
  }

  // General number format, e.g. "12,450", "4.8", "Rp 1,500"
  const generalMatch = str.match(/^([^0-9.-]*)([+-]?[0-9,]+(?:\.[0-9]+)?)(.*)$/)
  if (generalMatch) {
    const prefix = generalMatch[1]
    const numStr = generalMatch[2].replace(/,/g, "")
    const suffix = generalMatch[3]
    const num = parseFloat(numStr)
    if (!isNaN(num)) {
      const decimals = (numStr.split(".")[1] || "").length
      return {
        type: "number",
        num,
        prefix,
        suffix,
        decimals: Math.min(decimals, 2),
        rawText: str,
      }
    }
  }

  return { type: "raw", num: 0, prefix: "", suffix: "", decimals: 0, rawText: str }
}

function formatValue(current: number, parsed: ReturnType<typeof parseFormattedValue>): string {
  if (parsed.type === "time") {
    const sec = Math.max(0, Math.round(current))
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  if (parsed.decimals > 0) {
    const factor = Math.pow(10, parsed.decimals)
    const val = Math.round(current * factor) / factor
    const formatted = val.toLocaleString(undefined, {
      minimumFractionDigits: parsed.decimals,
      maximumFractionDigits: parsed.decimals,
    })
    return `${parsed.prefix}${formatted}${parsed.suffix}`
  }

  const intVal = Math.round(current)
  return `${parsed.prefix}${intVal.toLocaleString()}${parsed.suffix}`
}

export function AnimatedNumber({ value, duration = 850, className }: Props) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const currentValRef = useRef<number>(0)
  const animRef = useRef<JSAnimation | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const parsed = parseFormattedValue(value)

    if (parsed.type === "raw" || !spanRef.current) {
      if (spanRef.current) {
        spanRef.current.textContent = parsed.rawText || "0"
      }
      return
    }

    if (animRef.current) {
      try {
        animRef.current.revert?.()
      } catch {}
    }

    const startVal = isFirstRender.current ? 0 : currentValRef.current
    isFirstRender.current = false

    const tweenTarget = { val: startVal }

    animRef.current = animate(tweenTarget, {
      val: parsed.num,
      duration,
      ease: "outExpo",
      onUpdate: () => {
        currentValRef.current = tweenTarget.val
        if (spanRef.current) {
          spanRef.current.textContent = formatValue(tweenTarget.val, parsed)
        }
      },
      onComplete: () => {
        currentValRef.current = parsed.num
        if (spanRef.current) {
          spanRef.current.textContent = formatValue(parsed.num, parsed)
        }
      },
    })

    return () => {
      if (animRef.current) {
        try {
          animRef.current.revert?.()
        } catch {}
      }
    }
  }, [value, duration])

  const initialParsed = parseFormattedValue(value)
  const initialText = initialParsed.type === "raw" ? (initialParsed.rawText || "0") : formatValue(0, initialParsed)

  return (
    <span ref={spanRef} className={className}>
      {initialText}
    </span>
  )
}

export default AnimatedNumber
