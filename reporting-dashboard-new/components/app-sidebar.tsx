"use client"

import * as React from "react"
import { 
  LayoutDashboard, Monitor, Mic2, MessageSquare, 
  ShoppingBag, Wrench, UploadCloud, Settings 
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navigation = [
  {
    label: "Monitoring",
    items: [
      { title: "Home", url: "/home", icon: LayoutDashboard },
      { title: "Omnix Monitoring", url: "/omnix", icon: Monitor },
      { title: "Voice Performance", url: "/voice", icon: Mic2 },
      { title: "CSAT Feedback", url: "/csat", icon: MessageSquare },
    ],
  },
  {
    label: "Complain Handling",
    items: [
      { title: "Marketplace", url: "/marketplace", icon: ShoppingBag },
      { title: "Service Center", url: "/service-center", icon: Wrench },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Upload Menu", url: "/upload", icon: UploadCloud },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-4 font-bold text-xl tracking-tight">
          <span className="text-primary">GUNDAM</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}