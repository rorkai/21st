"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { ChevronRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { sections } from "@/lib/navigation"

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
        className="mt-14 pb-20"
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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/s/hook"}
                onClick={() => {
                  trackEvent(AMPLITUDE_EVENTS.VIEW_SIDEBAR_SECTION, {
                    sectionTitle: "Hooks",
                    path: "/s/hook",
                  })
                }}
              >
                <a href="/s/hook" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Hooks</span>
                  <Badge className="ml-1.5 text-xs bg-[#adfa1d] text-black px-1.5 rounded-md pointer-events-none select-none">
                    New
                  </Badge>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
