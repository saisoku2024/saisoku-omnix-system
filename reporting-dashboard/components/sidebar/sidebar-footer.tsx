import * as React from "react"

import { NavUser } from "@/components/sidebar/nav-user"

interface SidebarFooterProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function SidebarFooterContent({
  user,
}: SidebarFooterProps) {
  return <NavUser user={user} />
}