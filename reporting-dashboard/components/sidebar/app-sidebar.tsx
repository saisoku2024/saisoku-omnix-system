"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { SidebarLogo } from "@/components/sidebar/sidebar-logo"
import { SidebarFooterContent } from "@/components/sidebar/sidebar-footer"
import { SearchSidebar } from "@/components/sidebar/search-sidebar"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import { useTheme } from "@/contexts/theme-context"
import { sidebarMenu } from "@/components/sidebar/menu"

const data = {
  user: {
    name: "Admin",
    email: "admin@omnix.com",
    avatar: "https://i.pravatar.cc/100",
  },

  teams: [
    {
      name: "INSIGHT WORKSPACE",

      logo: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 28 28"
          fill="none"
        >
          <rect
            width="28"
            height="28"
            rx="7"
            fill="#0ea5e9"
          />

          <rect
            x="7"
            y="16"
            width="3"
            height="6"
            rx="1.5"
            fill="white"
            opacity="0.55"
          />

          <rect
            x="12"
            y="11"
            width="3"
            height="11"
            rx="1.5"
            fill="white"
            opacity="0.78"
          />

          <rect
            x="17"
            y="6"
            width="3"
            height="16"
            rx="1.5"
            fill="white"
          />
        </svg>
      ),

      plan: "Analytics Platform",
    },
  ],
}

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { isDark } = useTheme()
  const { toggleSidebar } = useSidebar()

  const bgClass = isDark
    ? "bg-[#0d1117]"
    : "bg-white"

  const borderClass = isDark
    ? "border-white/10"
    : "border-black/5"

  return (
    <Sidebar
      {...props}
      className={`${bgClass} border-r ${borderClass} transition-colors duration-300 font-sans antialiased tracking-tight`}
    >
      <SidebarHeader
        className={`border-b ${borderClass} px-3 py-2.5 flex flex-row items-center justify-between`}
      >
        <SidebarLogo teams={data.teams} />
        
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-200"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      </SidebarHeader>

      <SidebarContent>

  <SearchSidebar />

  <div className="px-2 py-1">
    <NavMain
      items={sidebarMenu}
      isDark={isDark}
    />
  </div>

</SidebarContent>

      <SidebarFooter
        className={`border-t ${borderClass} px-3 py-2`}
      >
        <SidebarFooterContent user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}