"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type Theme = "light" | "dark"
interface ThemeContextValue { theme: Theme; isDark: boolean; toggleTheme: () => void }

const ThemeContext = createContext<ThemeContextValue>({ theme:"dark", isDark:true, toggleTheme:()=>{} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme: () => setTheme(t => t==="dark"?"light":"dark") }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)