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

export type Item = {
  icon: LucideIcon
  title: string
  path: string
  children?: { title: string; path: string }[]
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
            if (item.children) {
              return (
                <ParentMenuItem
                  key={item.title}
                  item={item}
                  currentPath={currentPath}
                  onNavigate={handleMenuClick}
                />
              )
            }

            const isActive = currentPath === item.path

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  asChild
                >
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

function ParentMenuItem({
  item,
  currentPath,
  onNavigate,
}: {
  item: Item
  currentPath: string
  onNavigate: () => void
}) {
  const children = item.children ?? []
  const hasActiveChild = children.some((child) => currentPath === child.path)
  const [isOpen, setIsOpen] = useState(hasActiveChild)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={hasActiveChild}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <item.icon />
        <span>{item.title}</span>
        <ChevronRight
          className={`ml-auto transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {isOpen && (
        <SidebarMenuSub>
          {children.map((child) => {
            const isActive = currentPath === child.path
            return (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton isActive={isActive} asChild>
                  <RouterLink to={child.path} onClick={onNavigate}>
                    <span>{child.title}</span>
                  </RouterLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}
