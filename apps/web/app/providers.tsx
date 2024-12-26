"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClerkProvider } from "@clerk/nextjs"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { CommandMenu } from "@/components/CommandMenu"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { initAmplitude } from "@/lib/amplitude"

const queryClient = new QueryClient()

export function AppProviders({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isTagPage = pathname.startsWith("/s/")
  const isProPage = pathname.startsWith("/pro")
  const showSidebar = isHomePage || isTagPage || isProPage

  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        <CommandMenu />
        {showSidebar ? (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        ) : (
          children
        )}
      </ClerkProvider>
    </QueryClientProvider>
  )
}
