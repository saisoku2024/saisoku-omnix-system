"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000 // 8 Jam

/**
 * Hook to automatically log out the user after 8 hours of inactivity (idle).
 * Listens to mouse movements, key presses, clicks, and scrolling.
 */
export function useIdleLogout() {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const performLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout?reason=idle_timeout_8h", { method: "POST" })
    } catch {
      // Ignore
    } finally {
      router.push("/login?reason=idle_timeout")
    }
  }, [router])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (pathname === "/login") return
    timerRef.current = setTimeout(performLogout, EIGHT_HOURS_MS)
  }, [pathname, performLogout])

  useEffect(() => {
    if (pathname === "/login") return

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"]
    resetTimer()

    let lastExecution = 0
    const throttledReset = () => {
      const now = Date.now()
      if (now - lastExecution > 5000) {
        lastExecution = now
        resetTimer()
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, throttledReset, { passive: true })
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => {
        window.removeEventListener(event, throttledReset)
      })
    }
  }, [pathname, resetTimer])
}
