import { ReactNode } from "react"
import { Header } from "@/components/ui/header.client"

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header text="API Access" />
      <main>{children}</main>
    </div>
  )
}
