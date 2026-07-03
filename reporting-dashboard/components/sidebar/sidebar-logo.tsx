import * as React from "react"

import { TeamSwitcher } from "@/components/sidebar/team-switcher"

interface SidebarLogoProps {
  teams: {
    name: string
    logo: React.ReactNode
    plan: string
  }[]
}

export function SidebarLogo({
  teams,
}: SidebarLogoProps) {
  return <TeamSwitcher teams={teams} />
}