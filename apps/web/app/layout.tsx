import { GoogleAnalytics } from "@next/third-parties/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Metadata } from "next"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"
import { AppProviders } from "./providers"

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "21st.dev - The NPM for Design Engineers",
    template: "%s | 21st",
  },
  description:
    "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
  openGraph: {
    title: "21st.dev - The NPM for Design Engineers",
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          GeistSans.variable,
          GeistMono.variable,
          "font-sans [scrollbar-gutter:stable]",
        )}
      >
        <div className="h-full">
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
