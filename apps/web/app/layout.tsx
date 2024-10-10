// app/layout.tsx
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"

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
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
