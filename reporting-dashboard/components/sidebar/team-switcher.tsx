"use client"

import type { Team } from "@/types/sidebar"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface TeamSwitcherProps {
  teams: Team[]
}

export function TeamSwitcher({
  teams,
}: TeamSwitcherProps) {
  const activeTeam = teams[0]

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu className="gap-2">
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="
            h-14
            cursor-default
            rounded-xl

            border
            border-border/50

            bg-background/70
            backdrop-blur-sm

            shadow-sm

            hover:bg-background/70
          "
        >
          <div
            className="
              flex
              size-10
              items-center
              justify-center

              rounded-xl

              bg-sky-500/10
              text-sky-500

              ring-1
              ring-sky-500/20
            "
          >
            {activeTeam.logo}
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-[13px] font-semibold tracking-tight">
              {activeTeam.name}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {activeTeam.plan}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
