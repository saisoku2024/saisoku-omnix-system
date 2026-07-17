"use client"

import type React from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login"

  if (isAuthPage) {
    return <main className="min-h-screen flex-1 overflow-auto">{children}</main>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </SidebarProvider>
  )
}
