"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

import type { SidebarUser } from "@/types/sidebar"

interface NavUserProps {
  user: SidebarUser
}

export function NavUser({
  user: initialUser,
}: NavUserProps) {
  const { isMobile } = useSidebar()
  const [currentUser, setCurrentUser] = useState<SidebarUser>(initialUser)

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: string }) => {
        if (!active) return
        if (data.role === "guest") {
          setCurrentUser({
            name: "Guest User (Demo)",
            email: "guest@omnix.com",
            avatar: initialUser.avatar || "/avatars/guest.png",
          })
        } else if (data.role === "admin") {
          setCurrentUser({
            name: "Super Admin",
            email: "admin@omnix.com",
            avatar: initialUser.avatar || "/avatars/admin.png",
          })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [initialUser.avatar])

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout?reason=user_initiated", { method: "POST" })
      window.localStorage.clear()
      window.sessionStorage.clear()
    } finally {
      window.location.assign("/login")
    }
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={currentUser.avatar}
                  alt={currentUser.name}
                />
                <AvatarFallback className="rounded-lg">
                  {currentUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentUser.name}
                </span>
                <span className="truncate text-xs text-slate-400">
                  {currentUser.email}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="z-[100] w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border border-white/10 bg-[#0b1220] p-1.5 text-slate-100 shadow-2xl shadow-black/40"
            side={isMobile ? "bottom" : "top"}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentUser.name}
                  </span>
                  <span className="truncate text-xs text-slate-400">
                    {currentUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer px-2 py-2 text-slate-200 focus:bg-white/10 focus:text-white">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer px-2 py-2 text-slate-200 focus:bg-white/10 focus:text-white">
                <BadgeCheck className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer px-2 py-2 text-slate-200 focus:bg-white/10 focus:text-white">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer px-2 py-2 text-slate-200 focus:bg-white/10 focus:text-white">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer px-2 py-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
              onSelect={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
