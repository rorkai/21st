"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { ClerkProvider } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/sidebar-layout"
import { CommandMenu } from "@/components/ui/command-menu"
import { ProductHuntDialog } from "@/components/ui/product-hunt-dialog"

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
  const isAuthorsPage = pathname.startsWith("/authors")
  const showSidebar = isHomePage || isTagPage || isProPage || isAuthorsPage

  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        <CommandMenu />
        <ProductHuntDialog />
        <SpeedInsights />
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
