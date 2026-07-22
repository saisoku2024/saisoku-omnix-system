import type { ReactNode } from "react"

export interface SidebarMenuItem {
  title: string
  url: string
  icon: ReactNode
  isActive?: boolean
  roles?: string[]
  items?: SidebarMenuItem[]
}

export interface Team {
  name: string
  logo: ReactNode
  plan: string
}

export interface SidebarUser {
  name: string
  email: string
  avatar: string
}
