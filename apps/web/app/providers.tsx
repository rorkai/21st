"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClerkProvider } from "@clerk/nextjs"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { usePathname } from "next/navigation"

const queryClient = new QueryClient()

export function AppProviders({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        {isHomePage ? (
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
