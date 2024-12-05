import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { uiSystems, componentTypes } from "./HeaderServer"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent className="pt-14">
        <SidebarGroup>
          <SidebarGroupLabel>UI Systems</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {uiSystems.map((system) => (
                <SidebarMenuItem key={system.title}>
                  <SidebarMenuButton asChild>
                    <a href={system.href}>
                      <span>{system.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Component Types</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {componentTypes.map((component) => (
                <SidebarMenuItem key={component.title}>
                  <SidebarMenuButton asChild>
                    <a href={component.href}>
                      <span>{component.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
} 