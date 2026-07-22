"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import type { SidebarMenuItem as SidebarMenuItemType } from "@/types/sidebar"

export function NavMain({
  items,
  isDark = true,
}: {
  items: SidebarMenuItemType[]
  isDark?: boolean
}) {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: string }) => {
        if (active) setRole(data.role ?? "admin")
      })
      .catch(() => {
        if (active) setRole("admin")
      })
    return () => {
      active = false
    }
  }, [])

  const textMuted = isDark
    ? "text-gray-400"
    : "text-gray-500"

  const textActive = isDark
    ? "text-white"
    : "text-gray-900"

  const hoverText = isDark
    ? "hover:text-white"
    : "hover:text-gray-900"

  const hoverBg = isDark
    ? "hover:bg-white/5"
    : "hover:bg-black/5"

  const activeBg = isDark
    ? "bg-white/10"
    : "bg-black/10"

  const labelColor = isDark
    ? "text-gray-500"
    : "text-gray-400"

  const menuStateClass = `
    ${textMuted}
    ${hoverText}
    ${hoverBg}
    data-[active=true]:${textActive}
    data-[active=true]:${activeBg}
  `

  const visibleItems = items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    if (!role) return false
    return item.roles.includes(role) || role === "super_admin" || role === "admin"
  })

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className={`text-xs px-2 ${labelColor}`}
      >
        Platform
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1">
        {visibleItems.map((item) => {
          const hasChildren = !!item.items?.length

          const isParentActive =
            item.items?.some((sub) =>
              pathname.startsWith(sub.url)
            ) || false

          // MENU TANPA SUBMENU
          if (!hasChildren) {
            const isActive =
              item.url === "/"
                ? pathname === "/"
                : pathname.startsWith(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  data-active={isActive}
                  className={`
                    relative flex items-center gap-2
                    px-3 py-2 rounded-lg transition-all
                    ${menuStateClass}
                  `}
                >
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // MENU DENGAN SUBMENU
          return (
            <Collapsible
              key={item.title}
              defaultOpen={isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <div
                    className={`
                      relative flex items-center
                      w-full px-3 py-2 rounded-lg
                      transition-all cursor-pointer
                      ${menuStateClass}
                      ${
                        isParentActive
                          ? `${activeBg} ${textActive}`
                          : ""
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>

                    <ChevronRightIcon
                      className="
                        h-4 w-4
                        transition-transform
                        duration-200
                        group-data-[state=open]/collapsible:rotate-90
                        opacity-40
                      "
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub className="mt-1 space-y-1 pl-6">
                    {item.items?.map((subItem) => {
                      const isActive =
                        subItem.url === "/"
                          ? pathname === "/"
                          : pathname.startsWith(subItem.url)

                      return (
                        <SidebarMenuSubItem
                          key={subItem.title}
                        >
                          <SidebarMenuSubButton
                            asChild
                            data-active={isActive}
                            className={`
                              flex items-center gap-2
                              px-3 py-2 rounded-md
                              transition-all
                              ${menuStateClass}
                            `}
                          >
                            <Link href={subItem.url}>
                              {subItem.icon}
                              <span>
                                {subItem.title}
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
