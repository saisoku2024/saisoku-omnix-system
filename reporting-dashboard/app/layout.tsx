import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { ThemeProvider } from "@/contexts/theme-context"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Insight Dashboard",
  description: "Integrated moNitoring System & analytIcs hiGHlighT Dashboard",
}

// ✅ Satu export default saja, ThemeProvider langsung di dalam RootLayout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider defaultOpen={true}>

              {/* SIDEBAR */}
              <AppSidebar />

              {/* MAIN CONTENT */}
              <main className="flex-1 overflow-auto">
                {children}
              </main>

            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}