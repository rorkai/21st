"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClerkProvider } from "@clerk/nextjs"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
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

  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        {isHomePage || isTagPage ? (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
        ) : (
          children
        )}
      </ClerkProvider>
    </QueryClientProvider>
  )
}
