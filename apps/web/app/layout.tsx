// app/layout.tsx
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
  }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(geistSans.variable, geistMono.variable)}>
        <div className="px-4 h-full">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <Providers>{children}</Providers>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
