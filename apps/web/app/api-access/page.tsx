import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ApiKey } from "@/types/global"
import { ApiKeyManager } from "@/components/features/api/api-key-manager"
import { Suspense } from "react"
import { ApiDocs } from "@/components/features/api/api-docs"
import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/ui/header.client"

export const metadata: Metadata = {
  title: "API Access - 21st.dev",
  description: "Access our semantic search API for UI components",
}

async function getApiKey(userId: string) {
  const supabase = supabaseWithAdminAccess
  const { data: rawApiKey } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!rawApiKey) return null

  return {
    id: rawApiKey.id,
    key: rawApiKey.key,
    user_id: rawApiKey.user_id,
    plan: rawApiKey.plan || "free",
    requests_limit: rawApiKey.requests_limit || 100,
    requests_count: rawApiKey.requests_count || 0,
    created_at: rawApiKey.created_at || new Date().toISOString(),
    expires_at: rawApiKey.expires_at,
    last_used_at: rawApiKey.last_used_at,
    is_active: rawApiKey.is_active || true,
    project_url: rawApiKey.project_url || "",
  }
}

function ApiDocsLoading() {
  return <Skeleton className="h-[400px] w-full" />
}

function ApiKeyManagerLoading() {
  return <Skeleton className="h-[200px] w-full" />
}

export default async function ApiAccessPage() {
  const { userId } = auth()
  const apiKey = userId ? await getApiKey(userId) : null

  return (
    <div className="min-h-screen bg-background">
      <Header text="API Access" />
      <main>
        <div className="container mx-auto max-w-2xl py-6 px-4 sm:py-20 pt-20 sm:px-0">
          <div className="space-y-8 sm:space-y-12">
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight">
                  API Access
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Semantic UI Component API for AI-Powered Development
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                <div className="space-y-1">
                  <p className="font-medium">Semantic Search</p>
                  <p className="text-sm text-muted-foreground">
                    Natural language component search for AI code editors
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Community-Driven Library</p>
                  <p className="text-sm text-muted-foreground">
                    Growing collection of community components, verified for
                    quality and reliability
                  </p>
                </div>
              </div>
            </div>

            <Suspense fallback={<ApiDocsLoading />}>
              <ApiDocs />
            </Suspense>

            <div className="border-t pt-6 sm:pt-8">
              <Suspense fallback={<ApiKeyManagerLoading />}>
                <ApiKeyManager initialKey={apiKey} userId={userId} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
