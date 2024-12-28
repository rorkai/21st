import { supabaseWithAdminAccess } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import { ComponentRegistryResponse } from "./types"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { Tables } from "@/types/supabase"
import { extractCssVars } from "@/lib/parsers"

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string; component_slug: string } },
) {
  const { username, component_slug } = params

  try {
    const { data: component, error } = await supabaseWithAdminAccess
      .from("components")
      .select("*, user:users!user_id(*)")
      .eq("component_slug", component_slug)
      .eq("user.username", username)
      .not("user", "is", null)
      .returns<(Tables<"components"> & { user: Tables<"users"> })[]>()
      .single()

    if (error) {
      throw new Error(`Error fetching component: ${error.message}`)
    }

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      )
    }

    const userAgent = request.headers.get("user-agent") || ""
    const isPackageManager = /node-fetch|npm|yarn|pnpm|bun/i.test(userAgent)

    if (isPackageManager) {
      // This should finish reliably in serverless even without await
      // because we are using Vercel In-Function Concurrency
      // TODO: test this
      supabaseWithAdminAccess
        .from("components")
        .update({ downloads_count: component.downloads_count + 1 })
        .eq("id", component.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error incrementing downloads count:", error)
          } else {
            console.log("Downloads count incremented")
          }
        })
    }

    const dependencies = component.dependencies as Record<string, string>

    const resolvedRegistryDependencies = await resolveRegistryDependencyTree({
      supabase: supabaseWithAdminAccess,
      sourceDependencySlugs: [`${component.user.username}/${component_slug}`],
      withDemoDependencies: false,
    })

    if (resolvedRegistryDependencies.error) {
      throw resolvedRegistryDependencies.error
    }

    const files = Object.entries(
      resolvedRegistryDependencies.data.filesWithRegistry,
    ).map(([path, { code, registry }]) => ({
      path,
      content: code,
      type: `registry:${registry}`,
      target: "",
    }))

    const npmDependencies = Array.from(
      new Set([
        ...Object.keys(dependencies),
        ...Object.keys(resolvedRegistryDependencies.data.npmDependencies),
      ]),
    )

    const cssPromises = [
      component.tailwind_config_extension
        ? fetch(component.tailwind_config_extension).then((res) => res.text())
        : Promise.resolve(null),
      component.global_css_extension
        ? fetch(component.global_css_extension).then((res) => res.text())
        : Promise.resolve(null),
    ]

    const [tailwindConfig, globalCss] = await Promise.all(cssPromises)

    const cssVars = globalCss ? extractCssVars(globalCss) : null

    const tailwindConfigObject = tailwindConfig
      ? (() => {
          try {
            // First get the whole config object
            const configMatch = tailwindConfig.match(
              /module\.exports\s*=\s*({[\s\S]*})/,
            )
            if (!configMatch?.[1]) {
              console.log("No config match found")
              return {}
            }

            // First clean up the config string
            const cleanConfig = configMatch[1]
              .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // Remove comments
              .replace(/(\w+):/g, '"$1":') // Add quotes to keys
              .replace(/'/g, '"') // Normalize quotes

            // First find the theme object
            const themeMatch = cleanConfig.match(
              /"theme"\s*:\s*({[^}]*(?:}[^}]*)*})/,
            )
            if (!themeMatch?.[1]) {
              console.log("No theme object found")
              return {}
            }

            // Then find the extend object within theme
            const extendMatch = themeMatch[1].match(
              /"extend"\s*:\s*({[^}]*(?:}[^}]*)*})[^}]*$/,
            )
            if (!extendMatch?.[1]) {
              console.log("No extend object found")
              return {}
            }

            let cleanThemeExtend = extendMatch[1]
              .replace(/\s+/g, " ") // Normalize whitespace
              .replace(/,\s*,/g, ",") // Remove double commas
              .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
              .replace(/}\s*,?\s*"plugins"[\s\S]*$/, "}") // Remove everything after the extend object
              .replace(/}\s*}/g, "}") // Remove whitespace between closing braces
              .replace(/}(?!}|$)/g, "},") // Add commas between objects where missing
              .replace(/,+/g, ",") // Remove any remaining multiple commas
              .trim()

            // Count opening and closing braces
            const openBraces = (cleanThemeExtend.match(/{/g) || []).length
            const closeBraces = (cleanThemeExtend.match(/}/g) || []).length

            // Add missing closing braces
            if (openBraces > closeBraces) {
              cleanThemeExtend += "}".repeat(openBraces - closeBraces)
            }

            // Try to parse and re-stringify to ensure valid JSON
            const parsed = JSON.parse(cleanThemeExtend)
            return { theme: { extend: parsed } }
          } catch (error) {
            console.error("Error parsing tailwind theme.extend:", error)
            throw error
          }
        })()
      : {}

    const responseData: ComponentRegistryResponse = {
      name: component_slug,
      type: `registry:${component.registry}`,
      dependencies: npmDependencies.length > 0 ? npmDependencies : undefined,
      files,
      ...(cssVars ? { cssVars } : {}),
      ...(tailwindConfigObject
        ? { tailwind: { config: tailwindConfigObject as any } }
        : {}),
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Unexpected error:", error)
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
