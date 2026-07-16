import type { Metadata } from "next"

import "./globals.css"

import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { ThemeProvider } from "@/providers/theme-provider"

export const metadata: Metadata = {
  title: "Insight Dashboard",
  description: "Integrated moNitoring System & analytIcs hiGHlighT Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex font-sans">
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <main className="flex-1 overflow-auto">{children}</main>
            </SidebarProvider>
            <Toaster richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
