"use client"

import * as React from "react"
import type { Team } from "@/components/sidebar/types"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

interface TeamSwitcherProps {
  teams: Team[]
}

export function TeamSwitcher({
  teams,
}: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState<Team | undefined>(
    teams[0]
  )

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu className="gap-2">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="
                h-14
                rounded-xl

                border
                border-border/50

                bg-background/70
                backdrop-blur-sm

                shadow-sm

                transition-all
                duration-200

                hover:bg-accent
                hover:border-primary/40
                hover:shadow-md
                hover:scale-[1.01]

                data-[state=open]:bg-accent
                data-[state=open]:border-primary
                data-[state=open]:shadow-lg
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

                  transition-all
                  duration-200
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
              <ChevronsUpDownIcon 
                className="
                  ml-auto
                  h-4
                  w-4
                  opacity-60
                  transition-transform
                  duration-200
                " 
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="
              w-[--radix-dropdown-menu-trigger-width]
              min-w-60
              rounded-xl
              border
              shadow-xl
              backdrop-blur-sm
            "
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspace
            </DropdownMenuLabel>
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="
                  gap-3
                  rounded-lg
                  px-2
                  py-2
                "
              >
                <div className="flex size-8 items-center justify-center rounded-lg border">
                  {team.logo}
                </div>
                {team.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="
                gap-3
                rounded-lg
                px-2
                py-2
              "
            >
              <div className="flex size-8 items-center justify-center rounded-lg border bg-transparent">
                <PlusIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="font-medium text-muted-foreground">Create Workspace</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}