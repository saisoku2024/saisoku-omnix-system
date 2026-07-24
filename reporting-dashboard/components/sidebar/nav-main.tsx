"use client"

import { useCallback, useEffect, useState } from "react"
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
  useSidebar,
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
  const { setOpenMobile, isMobile } = useSidebar()

  const visibleItems = items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    if (!role) return false
    return item.roles.includes(role) || role === "super_admin" || role === "admin"
  })

  // Track currently expanded accordion parent menu
  const [prevKey, setPrevKey] = useState({ pathname, role })
  const [openParent, setOpenParent] = useState<string | null>(() => {
    const activeParent = visibleItems.find((item) =>
      item.items?.some((sub) => sub.url !== "/" && pathname.startsWith(sub.url))
    )
    return activeParent ? activeParent.title : null
  })

  // Automatically adjust open accordion parent when pathname or role changes during render
  if (prevKey.pathname !== pathname || prevKey.role !== role) {
    setPrevKey({ pathname, role })
    const activeParent = visibleItems.find((item) =>
      item.items?.some((sub) => sub.url !== "/" && pathname.startsWith(sub.url))
    )
    setOpenParent(activeParent ? activeParent.title : null)
  }

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  // Auto-close mobile drawer on route change
  useEffect(() => {
    closeMobileSidebar()
  }, [pathname, closeMobileSidebar])

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: string }) => {
        if (active && data.role) setRole(data.role)
      })
      .catch(() => {
        if (active) setRole("super_admin")
      })
    return () => {
      active = false
    }
  }, [])

  const textMuted = isDark ? "text-slate-400" : "text-slate-600"
  const textActive = isDark ? "text-white font-semibold" : "text-indigo-600 font-semibold"
  const hoverText = isDark ? "hover:text-white" : "hover:text-slate-900"
  const hoverBg = isDark ? "hover:bg-white/6" : "hover:bg-slate-100"
  const activeBg = isDark
    ? "bg-gradient-to-r from-indigo-500/20 to-indigo-500/5 text-white border-l-2 border-indigo-500"
    : "bg-gradient-to-r from-indigo-50 to-indigo-50/20 text-indigo-600 border-l-2 border-indigo-600 font-semibold"
  const labelColor = isDark ? "text-slate-500" : "text-slate-400"

  const handleLinkClick = () => {
    closeMobileSidebar()
  }

  const toggleParent = (title: string) => {
    setOpenParent((prev) => (prev === title ? null : title))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`text-[10px] font-bold uppercase tracking-wider px-2 ${labelColor} group-data-[collapsible=icon]:hidden`}>
        Platform Menu
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1">
        {visibleItems.map((item) => {
          const hasChildren = !!item.items?.length

          const isParentActive =
            item.items?.some((sub) =>
              sub.url !== "/" && pathname.startsWith(sub.url)
            ) || false

          const isOpen = openParent === item.title

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
                  tooltip={item.title}
                  className={`
                    relative flex items-center gap-2.5
                    px-3 py-2 rounded-xl transition-all duration-200
                    ${isActive ? activeBg : `${textMuted} ${hoverText} ${hoverBg}`}
                  `}
                >
                  <Link href={item.url} onClick={handleLinkClick}>
                    {item.icon}
                    <span className="text-[13px] group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // MENU DENGAN SUBMENU (Accordion Style)
          return (
            <Collapsible
              key={item.title}
              open={isOpen}
              onOpenChange={() => toggleParent(item.title)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`
                      relative flex items-center
                      w-full px-3 py-2 rounded-xl
                      transition-all duration-200 cursor-pointer
                      ${
                        isParentActive
                          ? activeBg
                          : `${textMuted} ${hoverText} ${hoverBg}`
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 flex-1 text-[13px]">
                      {item.icon}
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </div>

                    <ChevronRightIcon
                      className={`
                        h-4 w-4
                        transition-transform
                        duration-200
                        ${isOpen ? "rotate-90" : ""}
                        opacity-50
                        group-data-[collapsible=icon]:hidden
                      `}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                  <SidebarMenuSub className="mt-1 space-y-1 pl-4 border-l border-slate-200 dark:border-white/10 ml-3">
                    {item.items?.map((subItem) => {
                      const isActive =
                        subItem.url === "/"
                          ? pathname === "/"
                          : pathname.startsWith(subItem.url)

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            data-active={isActive}
                            className={`
                              flex items-center gap-2
                              px-3 py-1.5 rounded-lg
                              transition-all duration-200 text-[12px]
                              ${isActive ? activeBg : `${textMuted} ${hoverText} ${hoverBg}`}
                            `}
                          >
                            <Link href={subItem.url} onClick={handleLinkClick}>
                              {subItem.icon}
                              <span>{subItem.title}</span>
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
