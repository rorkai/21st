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
import { Dock, Box, ChevronRight, Sparkles } from "lucide-react"
import { usePathname } from "next/navigation"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"

const landingPageSections = [
  { title: "Announcements", href: "/s/announcement" },
  { title: "Backgrounds", href: "/s/background" },
  { title: "Borders", href: "/s/border" },
  { title: "Comparison", href: "/s/comparison" },
  { title: "Call to Action", href: "/s/call-to-action" },
  { title: "Docks", href: "/s/dock" },
  { title: "Features", href: "/s/features" },
  { title: "Footer", href: "/s/footer" },
  { title: "Hero", href: "/s/hero" },
  { title: "Images", href: "/s/image" },
  { title: "Maps", href: "/s/map" },
  { title: "Navigation Menus", href: "/s/navbar-navigation" },
  { title: "Pricing", href: "/s/pricing-section" },
  { title: "Scroll Area", href: "/s/scroll-area" },
  { title: "Team", href: "/s/team" },
  { title: "Testimonials", href: "/s/testimonials" },
  { title: "Text", href: "/s/text" },
  { title: "Video", href: "/s/video" },
].sort((a, b) => a.title.localeCompare(b.title))

const uiComponents = [
  { title: "Accordion", href: "/s/accordion" },
  { title: "Alert", href: "/s/alert" },
  { title: "Avatar", href: "/s/avatar" },
  { title: "Badge", href: "/s/badge" },
  { title: "Button", href: "/s/button" },
  { title: "Card", href: "/s/card" },
  { title: "Carousel", href: "/s/carousel" },
  { title: "Checkbox", href: "/s/checkbox" },
  { title: "Dialog / Modal", href: "/s/modal-dialog" },
  { title: "Dropdown", href: "/s/dropdown" },
  { title: "Empty State", href: "/s/empty-state" },
  { title: "File Tree", href: "/s/file-tree" },
  { title: "File Upload", href: "/s/upload-download" },
  { title: "Icons", href: "/s/icons" },
  { title: "Input", href: "/s/input" },
  { title: "Numbers", href: "/s/number" },
  { title: "Pagination", href: "/s/pagination" },
  { title: "Sidebar", href: "/s/sidebar" },
  { title: "Sign In", href: "/s/sign-in" },
  { title: "Sign up", href: "/s/registration-signup" },
  { title: "Select", href: "/s/select" },
  { title: "Slider", href: "/s/slider" },
  { title: "Tables", href: "/s/table" },
  { title: "Tags", href: "/s/chip-tag" },
  { title: "Tabs", href: "/s/tab" },
  { title: "Text Area", href: "/s/textarea" },
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
    title: "UI elements",
    icon: Box,
    items: uiComponents,
  },
]

type SidebarState = {
  openSections: Record<string, boolean>
  scrollPosition: number
}

const sidebarStateAtom = atomWithStorage<SidebarState>("sidebarState", {
  openSections: { "Landing Pages": true, "UI elements": true },
  scrollPosition: 0,
})

export function AppSidebar() {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [sidebarState, setSidebarState] = useAtom(sidebarStateAtom)
  const initialRender = useRef(true)

  useEffect(() => {
    if (initialRender.current && sidebarRef.current) {
      sidebarRef.current.scrollTop = sidebarState.scrollPosition
      initialRender.current = false
    }
  }, [])

  const handleScroll = () => {
    if (sidebarRef.current) {
      setSidebarState((prev) => ({
        ...prev,
        scrollPosition: sidebarRef.current?.scrollTop || 0,
      }))
    }
  }

  if (!sidebarState) {
    return null
  }

  return (
    <Sidebar>
      <SidebarContent
        className="pt-14"
        ref={sidebarRef}
        onScroll={handleScroll}
        suppressHydrationWarning
      >
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/pro"}
                onClick={() => {
                  trackEvent(AMPLITUDE_EVENTS.VIEW_SIDEBAR_SECTION, {
                    sectionTitle: "Pro Components",
                    path: "/pro",
                  })
                }}
              >
                <a href="/pro" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Pro Components</span>
                  <Badge className="ml-1.5 text-xs bg-[#adfa1d] text-black px-1.5 rounded-md pointer-events-none select-none">
                    New
                  </Badge>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {sections.map((section) => (
              <Collapsible
                key={section.title}
                asChild
                open={sidebarState.openSections[section.title]}
                onOpenChange={(isOpen) => {
                  setSidebarState((prev) => ({
                    ...prev,
                    openSections: {
                      ...prev.openSections,
                      [section.title]: isOpen,
                    },
                  }))
                }}
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
                            onClick={() => {
                              trackEvent(
                                AMPLITUDE_EVENTS.VIEW_SIDEBAR_SECTION,
                                {
                                  sectionTitle: section.title,
                                  itemTitle: item.title,
                                  path: item.href,
                                },
                              )
                            }}
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
