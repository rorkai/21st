
import { Metadata } from "next"
import { Code } from "@/components/ui/code"

export const metadata: Metadata = {
  title: "API Documentation - 21st.dev",
  description: "Semantic search API for UI components with vector embeddings",
}

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-zinc dark:prose-invert">
      <h1 className="font-display text-3xl font-bold">API Documentation</h1>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-4">
          The 21st.dev API provides semantic search capabilities for UI
          components using vector embeddings. This allows you to find components
          based on natural language descriptions and functionality.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold">Authentication</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-4">
          All API requests require an API key to be included in the request
          headers.
        </p>
        <Code
          code="x-api-key: your_api_key_here"
          language="bash"
          display="block"
          fontSize="sm"
          className="py-4"
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold">Endpoints</h2>

        <div className="mt-8">
          <h3 className="text-xl font-semibold">Search Components</h3>
          <Code
            code="POST /api/search"
            language="bash"
            display="block"
            fontSize="sm"
            className="py-4"
          />

          <h4 className="font-semibold mt-6">Request Body</h4>
          <Code
            code={`{
  "search": "dropdown with animation"
}`}
            language="json"
            display="block"
            fontSize="sm"
            className="py-4"
          />

          <h4 className="font-semibold mt-6">Response</h4>
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
            className="py-4"
          />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold">Rate Limits</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <h3 className="font-semibold">Free</h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              1,000 requests/month
            </p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <h3 className="font-semibold">Pro</h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              10,000 requests/month
            </p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <h3 className="font-semibold">Enterprise</h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Custom limits
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold">Example Usage</h2>
        <Code
          code={`curl -X POST 'https://21st.dev/api/search' \\
-H 'x-api-key: your_api_key_here' \\
-H 'Content-Type: application/json' \\
-d '{"search":"dropdown with animation"}'`}
          language="bash"
          display="block"
          fontSize="sm"
          className="py-4"
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold">Error Handling</h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-semibold">401 Unauthorized</h3>
            <Code
              code={`{
  "error": "API key is required"
}`}
              language="json"
              display="block"
              fontSize="sm"
              className="py-4"
            />
          </div>
          <div>
            <h3 className="font-semibold">400 Bad Request</h3>
            <Code
              code={`{
  "error": "Search query is required"
}`}
              language="json"
              display="block"
              fontSize="sm"
              className="py-4"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
