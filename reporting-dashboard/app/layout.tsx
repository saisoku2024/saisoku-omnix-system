import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"

import "./globals.css"

import { AppShell } from "@/components/app-shell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/providers/theme-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SAISOKU OMNIX - Insight Dashboard",
  description: "Integrated Monitoring System & Analytics Highlight Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-full flex font-sans bg-background text-foreground selection:bg-indigo-500/30 selection:text-indigo-200">
        <ThemeProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
            <Toaster richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
