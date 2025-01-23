import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Code } from "@/components/ui/code"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ApiKey } from "@/types/global"
import { ApiKeyManager } from "@/components/features/api/api-key-manager"

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

function ApiDocs() {
  return (
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
  )
}

export default async function ApiAccessPage() {
  const { userId } = auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const apiKey = await getApiKey(userId)

  return (
    <div className="mx-auto max-w-2xl py-20">
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-tight">API Access</h1>
            <p className="text-muted-foreground">
              Semantic UI Component API for AI-Powered Development
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="space-y-1">
              <p className="font-medium">Semantic Search</p>
              <p className="text-sm text-muted-foreground">
                Natural language component search for AI code editors
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Community-Driven Library</p>
              <p className="text-sm text-muted-foreground">
                Growing collection of community components, verified for quality
                and reliability
              </p>
            </div>
          </div>
        </div>

        <ApiDocs />

        <div className="border-t pt-8">
          <ApiKeyManager initialKey={apiKey} userId={userId} />
        </div>
      </div>
    </div>
  )
}
