import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { SearchResponse } from "@/types/global"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SUPABASE_SEARCH_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-search`

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 401 })
  }

  try {
    // Check API key
    const { data: keyCheck, error: keyError } = await supabase.rpc(
      "check_api_key",
      { api_key: apiKey },
    )

    if (keyError) {
      console.error("API key check error:", keyError)
      return NextResponse.json(
        { error: "Error validating API key" },
        { status: 401 },
      )
    }

    if (!keyCheck?.valid) {
      return NextResponse.json(
        { error: keyCheck?.error || "Invalid API key" },
        { status: 401 },
      )
    }

    // Get search query
    const body = await request.json()
    console.log("Request body:", body)

    const { search } = body
    if (!search) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      )
    }

    // Call Supabase search function
    const response = await fetch(SUPABASE_SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ search }),
    })

    if (!response.ok) {
      console.error("Supabase search error:", {
        status: response.status,
        statusText: response.statusText,
      })
      const errorText = await response.text()
      console.error("Error response:", errorText)
      throw new Error(`Failed to fetch from Supabase: ${errorText}`)
    }

    const data = await response.json()
    console.log("Search results:", data)

    if (!Array.isArray(data)) {
      console.error("Unexpected data format:", data)
      throw new Error("Unexpected response format from search")
    }

    // Filter and transform data
    const results = data.map((item: any) => {
      // Для отладки
      console.log("Raw item:", JSON.stringify(item, null, 2))

      return {
        name: item.name || "",
        preview_url: item.preview_url || "",
        video_url: item.video_url,
        component_data: {
          name: item.component_data?.name || "",
          description: item.component_data?.description || "",
          code: item.component_data?.code || "",
          install_command:
            item.component_data?.install_command ||
            `pnpm dlx shadcn@latest add "https://21st.dev/r/${item.user_data?.username}/${item.component_data?.component_slug}"`,
        },
        component_user_data: {
          name: item.user_data?.name || "",
          username: item.user_data?.username || "",
          image_url: item.user_data?.image_url || null,
        },
      }
    })

    // Return filtered results with metadata
    return NextResponse.json<SearchResponse>({
      results,
      metadata: {
        plan: keyCheck.plan,
        requests_remaining: keyCheck.requests_remaining,
      },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
