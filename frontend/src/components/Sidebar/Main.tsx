import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type NavChild = {
  title: string
  path: string
}

export type Item = {
  icon: LucideIcon
  title: string
  path?: string
  children?: NavChild[]
}

interface MainProps {
  items: Item[]
}

export function Main({ items }: MainProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.children && item.children.length > 0) {
              return (
                <NavGroup
                  key={item.title}
                  item={item}
                  currentPath={currentPath}
                  onNavigate={handleMenuClick}
                />
              )
            }

            if (!item.path) {
              return null
            }

            const isActive = currentPath === item.path

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
                  <RouterLink to={item.path} onClick={handleMenuClick}>
                    <item.icon />
                    <span>{item.title}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

interface NavGroupProps {
  item: Item
  currentPath: string
  onNavigate: () => void
}

function NavGroup({ item, currentPath, onNavigate }: NavGroupProps) {
  const children = item.children ?? []
  const isChildActive = children.some((child) => currentPath === child.path)
  const [open, setOpen] = useState(isChildActive)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isChildActive}
        onClick={() => setOpen((prev) => !prev)}
      >
        <item.icon />
        <span className="flex-1">{item.title}</span>
        <ChevronRight className={cn("transition-transform", open && "rotate-90")} />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {children.map((child) => (
            <SidebarMenuSubItem key={child.title}>
              <SidebarMenuSubButton isActive={currentPath === child.path} asChild>
                <RouterLink to={child.path} onClick={onNavigate}>
                  <span>{child.title}</span>
                </RouterLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}
