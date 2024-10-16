import { supabaseWithAdminAccess } from "@/utils/supabase"
import { NextRequest, NextResponse } from "next/server"
import { ComponentRegistryResponse } from "./types"

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string; component_slug: string } },
) {
  const { username, component_slug } = params
  const apiUrl = process.env.NEXT_PUBLIC_CDN_URL

  try {
    const { data: component, error } = await supabaseWithAdminAccess
      .from("components")
      .select("*, user:users!user_id(*)")
      .eq("component_slug", component_slug)
      .eq("user.username", username)
      .single()

    if (error || !component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      )
    }

    const dependencies = component.dependencies as Record<string, string>
    const internalDependencies = component.internal_dependencies as Record<string, string>

    const componentCodeResponse = await fetch(component.code)
    if (!componentCodeResponse.ok) {
      throw new Error(
        `Error fetching component code: ${componentCodeResponse.statusText}`,
      )
    }
    const code = await componentCodeResponse.text()

    const internalDependenciesPromises = Object.entries(
      internalDependencies,
    ).flatMap(([path, slugs]) => {
      const slugArray = Array.isArray(slugs) ? slugs : [slugs]
      return slugArray.map(async (slug) => {
        const dependencyUrl = `${apiUrl}/${component.user_id}/${slug}.tsx`
        const response = await fetch(dependencyUrl)
        if (!response.ok) {
          throw new Error(
            `Error downloading file for ${slug}: ${response.statusText}`,
          )
        }
        const code = await response.text()
        const fullPath = path.endsWith(".tsx") ? path : `${path}.tsx`
        return {
          path: fullPath,
          content: code,
          type: "registry:ui",
          target: "",
        }
      })
    })

    const internalDependenciesResults = await Promise.all(
      internalDependenciesPromises,
    )

    const files = [
      {
        path: `components/ui/${username}/${component_slug}.tsx`,
        content: code,
        type: "registry:ui",
        target: "",
      },
      ...internalDependenciesResults,
    ]

    const responseData: ComponentRegistryResponse = {
      name: component_slug,
      type: "registry:ui",
      dependencies:
        Object.keys(dependencies).length > 0
          ? Object.keys(dependencies)
          : undefined,
      files,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Unexpected error:", error)
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
