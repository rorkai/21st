"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useClerkSupabaseClient } from "@/lib/clerk"
import PublishComponentForm from "@/components/publish/PublishComponentForm"
import fetchFileTextContent from "@/lib/utils/fetchFileTextContent"

interface ComponentData {
  code: string
  tailwindConfig?: string | null
  globalCss?: string | null
  component: any
}

export default function AddDemoPage() {
  const searchParams = useSearchParams()
  const componentId = searchParams.get("componentId")
  const supabase = useClerkSupabaseClient()
  const [componentData, setComponentData] = useState<ComponentData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchComponentData() {
      if (!componentId) {
        setError("No componentId provided")
        return
      }

      console.log("Fetching component with id:", componentId)

      const { data: component, error: supabaseError } = await supabase
        .from("components")
        .select(
          `
          *,
          user:users!components_user_id_fkey(*)
        `,
        )
        .eq("id", componentId)
        .single()

      if (supabaseError) {
        console.error("Supabase error:", supabaseError)
        setError(supabaseError.message)
        return
      }

      if (!component) {
        console.error("No component found")
        setError("Component not found")
        return
      }

      console.log("Component found:", component)

      try {
        const [codeResult, tailwindConfigResult, globalCssResult] =
          await Promise.all([
            fetchFileTextContent(component.code),
            component.tailwind_config_extension
              ? fetchFileTextContent(component.tailwind_config_extension)
              : Promise.resolve({ data: null, error: null }),
            component.global_css_extension
              ? fetchFileTextContent(component.global_css_extension)
              : Promise.resolve({ data: null, error: null }),
          ])

        if (codeResult.error) {
          console.error("Failed to fetch component code:", codeResult.error)
          setError("Failed to fetch component code")
          return
        }

        console.log("Files fetched successfully")

        setComponentData({
          code: codeResult.data!,
          tailwindConfig: tailwindConfigResult.data,
          globalCss: globalCssResult.data,
          component: {
            ...component,
            code: codeResult.data!,
          },
        })
      } catch (err) {
        console.error("Error fetching files:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    fetchComponentData()
  }, [componentId, supabase])

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (!componentData) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <PublishComponentForm
      mode="add-demo"
      existingComponent={componentData.component}
      initialStep="demoCode"
      initialCode={componentData.code}
      initialTailwindConfig={componentData.tailwindConfig}
      initialGlobalCss={componentData.globalCss}
    />
  )
}
