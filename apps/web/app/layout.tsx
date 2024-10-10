// app/layout.tsx
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} px-4 h-full`}
    >
      <body>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
