"use client"

import * as React from "react"
import { ChevronLeft } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { SidebarLogo } from "@/components/sidebar/sidebar-logo"
import { SidebarFooterContent } from "@/components/sidebar/sidebar-footer"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "@/providers/theme-provider"
import { sidebarMenu, sidebarTeams, sidebarUser } from "@/config/sidebar"

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { isDark } = useTheme()
  const { toggleSidebar, state } = useSidebar()

  const bgClass = isDark
    ? "bg-[#030712] text-slate-100"
    : "bg-white text-slate-900 shadow-lg shadow-slate-200/50"

  const borderClass = isDark
    ? "border-white/10"
    : "border-slate-200"

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      className={`${bgClass} border-r ${borderClass} transition-colors duration-300 font-sans antialiased tracking-tight`}
    >
      <SidebarHeader
        className={`border-b ${borderClass} px-3 py-2.5 flex flex-row items-center justify-between group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:justify-center`}
      >
        <SidebarLogo teams={sidebarTeams} />
      </SidebarHeader>

      <SidebarContent>
        <div className="px-2 py-2 group-data-[collapsible=icon]:px-1">
          <NavMain
            items={sidebarMenu}
            isDark={isDark}
          />
        </div>
      </SidebarContent>

      <SidebarFooter
        className={`border-t ${borderClass} px-3 py-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:justify-center`}
      >
        <SidebarFooterContent user={sidebarUser} />
      </SidebarFooter>

      <button
        onClick={toggleSidebar}
        className={`absolute -right-4 top-1/2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border ${borderClass} ${bgClass} shadow-md transition-all duration-200 cursor-pointer ${
          isDark
            ? "text-slate-400 hover:bg-white/10 hover:text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        title="Toggle Sidebar"
      >
        <ChevronLeft 
          className={`w-4 h-4 transition-transform duration-200 ${state === "collapsed" ? "rotate-180" : ""}`} 
        />
      </button>

      <SidebarRail />
    </Sidebar>
  )
}
