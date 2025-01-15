import { GoogleAnalytics } from "@next/third-parties/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"
import { AppProviders } from "./providers"

import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(GeistSans.variable, GeistMono.variable, "font-sans")}>
        <div className="px-4 h-full">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <AppProviders>{children}</AppProviders>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </div>
      </body>
      <GoogleAnalytics gaId="G-X7C2K3V7GX" />
    </html>
  )
}
