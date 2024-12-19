"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Dock, Box, ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const landingPageSections = [
  { title: "Announcements", href: "/s/announcements" },
  { title: "Backgrounds", href: "/s/backgrounds" },
  { title: "Borders", href: "/s/borders" },
  { title: "Comparison", href: "/s/comparison" },
  { title: "Docks", href: "/s/docks" },
  { title: "Features", href: "/s/features" },
  { title: "Footer", href: "/s/footer" },
  { title: "Hero", href: "/s/hero" },
  { title: "Images", href: "/s/images" },
  { title: "Maps", href: "/s/maps" },
  { title: "Navigation Menu", href: "/s/navbar-navigation" },
  { title: "Pricing", href: "/s/pricing" },
  { title: "Scroll Area", href: "/s/scroll-area" },
  { title: "Sparkles", href: "/s/sparkles" },
  { title: "Team", href: "/s/team" },
  { title: "Testimonials", href: "/s/testimonials" },
  { title: "Text", href: "/s/text" },
  { title: "Text Effects", href: "/s/text-effects" },
  { title: "Video", href: "/s/video" },
].sort((a, b) => a.title.localeCompare(b.title))

const uiComponents = [
  { title: "Accordion", href: "/s/accordion" },
  { title: "Alert", href: "/s/alert" },
  { title: "Avatar", href: "/s/avatar" },
  { title: "Badge", href: "/s/badge" },
  { title: "Button", href: "/s/button" },
  { title: "Card", href: "/s/card" },
  { title: "Checkbox", href: "/s/checkbox" },
  { title: "Dialog / Modal", href: "/s/modal-dialog" },
  { title: "Dropdown / Select", href: "/s/select-dropdown" },
  { title: "Empty State", href: "/s/empty-state" },
  { title: "File Tree", href: "/s/file-tree" },
  { title: "File Upload", href: "/s/file-upload" },
  { title: "Icons", href: "/s/icons" },
  { title: "Input", href: "/s/input" },
  { title: "Numbers", href: "/s/numbers" },
  { title: "Pagination", href: "/s/pagination" },
  { title: "Sidebar", href: "/s/sidebar" },
  { title: "Sign In & Sign Up", href: "/s/auth" },
  { title: "Slider", href: "/s/slider" },
  { title: "Tables", href: "/s/tables" },
  { title: "Tags", href: "/s/tags" },
  { title: "Tabs", href: "/s/tab" },
  { title: "Text Area", href: "/s/text-area" },
  { title: "Toast", href: "/s/toast" },
  { title: "Toggle", href: "/s/toggle" },
  { title: "Tooltip", href: "/s/tooltip" },
].sort((a, b) => a.title.localeCompare(b.title))

const sections = [
  {
    title: "Landing Pages",
    icon: Dock,
    items: landingPageSections,
  },
  {
    title: "UI Components",
    icon: Box,
    items: uiComponents,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent className="pt-14">
        <SidebarGroup>
          <SidebarMenu>
            {sections.map((section) => (
              <Collapsible
                key={section.title}
                asChild
                defaultOpen={true}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={section.title}>
                      {<section.icon className="w-4 h-4" />}
                      <span>{section.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {section.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.href}
                          >
                            <a href={item.href}>
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
} 