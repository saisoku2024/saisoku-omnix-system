"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("saisoku_theme") as Theme | null
      if (saved === "light" || saved === "dark") {
        return saved
      }
    }
    return "dark"
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
    localStorage.setItem("saisoku_theme", theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () =>
        setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
