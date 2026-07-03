import {
  BarChart3,
  Briefcase,
  Clock,
  FolderKanban,
  Home,
  Users,
} from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { User } from "./User"

const baseItems: Item[] = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: Briefcase, title: "Items", path: "/items" },
]

const timeTrackingItems: Item[] = [
  { icon: FolderKanban, title: "Projects", path: "/projects" },
  { icon: Clock, title: "Log Time", path: "/log-time" },
  { icon: BarChart3, title: "Hours Dashboard", path: "/hours-dashboard" },
]

const adminItems: Item[] = [{ icon: Users, title: "Admin", path: "/admin" }]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={baseItems} />
        <Main items={timeTrackingItems} label="Time Tracking" />
        {currentUser?.is_superuser ? <Main items={adminItems} /> : null}
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
