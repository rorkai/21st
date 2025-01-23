import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Code } from "@/components/ui/code"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ApiKey } from "@/types/global"
import { ApiKeyManager } from "@/components/features/api/api-key-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        <h2 className="text-sm font-medium">Integration Examples</h2>
        <Tabs defaultValue="next" className="w-full">
          <TabsList className="relative h-auto w-full gap-0.5 bg-transparent p-0 pl-2 justify-start before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
            <TabsTrigger
              value="next"
              className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            >
              Next.js
            </TabsTrigger>
            <TabsTrigger
              value="react"
              className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            >
              React
            </TabsTrigger>
            <TabsTrigger
              value="node"
              className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            >
              Node.js
            </TabsTrigger>
          </TabsList>
          <TabsContent value="next" className="mt-6">
            <div className="space-y-4">
              <Code
                code={`// .env
API_KEY=your_api_key_here`}
                language="bash"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// app/api/components/route.ts
import { NextResponse } from 'next/server'

if (!process.env.API_KEY) {
  throw new Error('API_KEY is not defined')
}

export async function POST(req: Request) {
  const body = await req.json()
  const response = await fetch('https://21st.dev/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()
  return NextResponse.json(data)
}`}
                language="typescript"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// app/components/search.tsx
'use client'

export async function searchComponents(query: string) {
  const res = await fetch('/api/components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search: query })
  })
  
  if (!res.ok) {
    throw new Error('Failed to search components')
  }
  
  return res.json()
}`}
                language="typescript"
                display="block"
                fontSize="sm"
              />
            </div>
          </TabsContent>
          <TabsContent value="react" className="mt-6">
            <div className="space-y-4">
              <Code
                code={`// .env
VITE_API_KEY=your_api_key_here`}
                language="bash"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// src/lib/api.ts
const API_KEY = import.meta.env.VITE_API_KEY

export async function searchComponents(query: string) {
  const res = await fetch('https://21st.dev/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ search: query })
  })

  if (!res.ok) {
    throw new Error('Failed to search components')
  }

  return res.json()
}`}
                language="typescript"
                display="block"
                fontSize="sm"
              />
            </div>
          </TabsContent>
          <TabsContent value="node" className="mt-6">
            <div className="space-y-4">
              <Code
                code={`// .env
API_KEY=your_api_key_here`}
                language="bash"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// index.js
const express = require('express')
const app = express()

if (!process.env.API_KEY) {
  throw new Error('API_KEY is not defined')
}

app.post('/api/components', async (req, res) => {
  try {
    const response = await fetch('https://21st.dev/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to search components' })
  }
})`}
                language="javascript"
                display="block"
                fontSize="sm"
              />
            </div>
          </TabsContent>
        </Tabs>
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
