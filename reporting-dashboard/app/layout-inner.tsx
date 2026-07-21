"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"

export function RootLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return <main className="flex-1 overflow-auto">{children}</main>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {/* SIDEBAR */}
      <AppSidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </SidebarProvider>
  )
}
