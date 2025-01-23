import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Code } from "@/components/ui/code"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ApiKey } from "@/types/global"
import { ApiKeyManager } from "@/components/features/api/api-key-manager"
import { TermsDialog } from "@/components/features/api/terms-dialog"

export const metadata: Metadata = {
  title: "API Documentation - 21st.dev",
  description: "Access our semantic search API for UI components",
}

export default async function ApiDocsPage() {
  const { userId } = auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const supabase = supabaseWithAdminAccess

  const { data: rawApiKey } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .single()

  const apiKey: ApiKey | null = rawApiKey
    ? {
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
    : null

  return (
    <div className="mx-auto max-w-2xl py-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-tight">API Access</h1>
            <p className="text-muted-foreground">
              Semantic search API for AI-powered applications
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="space-y-1">
              <p className="font-medium">Semantic Search</p>
              <p className="text-sm text-muted-foreground">
                Natural language component search for AI applications
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Curated Library</p>
              <p className="text-sm text-muted-foreground">
                Hand-picked components with quality review
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-medium">Authentication</h2>
            <Code
              code="x-api-key: your_api_key_here"
              language="bash"
              display="block"
              fontSize="sm"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-medium">Search Components</h2>
            <Code
              code={`curl -X POST 'https://21st.dev/api/search' \\
-H 'x-api-key: your_api_key_here' \\
-H 'Content-Type: application/json' \\
-d '{"search":"dropdown with animation"}'`}
              language="bash"
              display="block"
              fontSize="sm"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-medium">Response Format</h2>
            <Code
              code={`{
  "results": [{
    "name": "Animated Dropdown",
    "preview_url": "https://...",
    "component_data": {
      "name": "Dropdown Menu",
      "description": "Enhanced dropdown with animations",
      "code": "https://...",
      "install_command": "pnpm dlx shadcn@latest add \\"https://21st.dev/r/dropdown\\""
    }
  }],
  "metadata": {
    "requests_remaining": 999
  }
}`}
              language="json"
              display="block"
              fontSize="sm"
            />
          </div>
        </div>

        <div className="border-t pt-8">
          <ApiKeyManager initialKey={apiKey} userId={userId} />
        </div>
      </div>
    </div>
  )
}
