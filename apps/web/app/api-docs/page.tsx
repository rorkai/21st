import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Code } from "@/components/ui/code"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ApiKey } from "@/types/global"
import { Webhook } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiKeyManager } from "@/components/features/api/api-key-manager"

export const metadata: Metadata = {
  title: "API Documentation - 21st.dev",
  description: "Semantic search API for UI components with vector embeddings",
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

  // Transform raw data to match ApiKey type if exists
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
    <div className="mx-auto max-w-4xl px-4 py-20">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">API Access</h1>
        <p className="text-sm text-muted-foreground">
          Access the 21st.dev API to integrate UI components in your projects
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Webhook className="h-4 w-4" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Follow these steps to integrate the API in your project
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <h3 className="font-medium">1. Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Include your API key in the request headers:
              </p>
              <Code
                code="x-api-key: your_api_key_here"
                language="bash"
                display="block"
                fontSize="sm"
                className="my-2"
              />
            </div>

            <div className="grid gap-2">
              <h3 className="font-medium">2. Search Components</h3>
              <p className="text-sm text-muted-foreground">
                Use the search endpoint to find components:
              </p>
              <Code
                code={`curl -X POST 'https://21st.dev/api/search' \\
-H 'x-api-key: your_api_key_here' \\
-H 'Content-Type: application/json' \\
-d '{"search":"dropdown with animation"}'`}
                language="bash"
                display="block"
                fontSize="sm"
                className="my-2"
              />
            </div>

            <div className="grid gap-2">
              <h3 className="font-medium">Response Format</h3>
              <Code
                code={`{
  "results": [
    {
      "name": "Animated Dropdown",
      "preview_url": "https://...",
      "video_url": "https://...",
      "component_data": {
        "name": "Dropdown Menu",
        "description": "Enhanced dropdown with animations",
        "code": "https://...",
        "install_command": "pnpm dlx shadcn@latest add \\"https://21st.dev/r/username/dropdown\\""
      },
      "component_user_data": {
        "name": "John Doe",
        "username": "johndoe",
        "image_url": "https://..."
      }
    }
  ],
  "metadata": {
    "plan": "free",
    "requests_remaining": 999
  }
}`}
                language="json"
                display="block"
                fontSize="sm"
                className="my-2"
              />
            </div>

            <div className="grid gap-2">
              <h3 className="font-medium">Rate Limits</h3>
              <p className="text-sm text-muted-foreground">
                Free tier includes 100 requests/month.{" "}
                <a
                  href="https://discord.gg/Qx4rFunHfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Contact us
                </a>{" "}
                for higher limits.
              </p>
            </div>

            <div className="grid gap-2">
              <h3 className="font-medium">Error Handling</h3>
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    401 Unauthorized:
                  </p>
                  <Code
                    code={`{
  "error": "API key is required"
}`}
                    language="json"
                    display="block"
                    fontSize="sm"
                    className="my-2"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    400 Bad Request:
                  </p>
                  <Code
                    code={`{
  "error": "Search query is required"
}`}
                    language="json"
                    display="block"
                    fontSize="sm"
                    className="my-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ApiKeyManager initialKey={apiKey} userId={userId} />
      </div>
    </div>
  )
}
