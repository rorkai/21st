"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useClerkSupabaseClient } from "@/lib/clerk"
import PublishComponentForm from "@/components/features/publish/publish-layout"
import fetchFileTextContent from "@/lib/utils/fetchFileTextContent"
import { LoadingSpinnerPage } from "@/components/ui/loading-spinner"

interface ComponentData {
  code: string
  tailwindConfig?: string | null
  globalCss?: string | null
  component: any
}

function AddDemoContent() {
  const searchParams = useSearchParams()
  const componentId = searchParams.get("componentId")
  const supabase = useClerkSupabaseClient()
  const [componentData, setComponentData] = useState<ComponentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchComponentData() {
      try {
        if (!componentId) {
          setError("No componentId provided")
          return
        }

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
      } finally {
        setIsLoading(false)
      }
    }

    fetchComponentData()
  }, [componentId, supabase])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="text-red-500 text-lg font-medium">Error</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (isLoading || !componentData) {
    return (
      <LoadingSpinnerPage
        text="Loading component..."
        size="lg"
        showText={true}
      />
    )
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

export default function AddDemoPage() {
  return (
    <Suspense
      fallback={
        <LoadingSpinnerPage text="Loading..." size="lg" showText={true} />
      }
    >
      <AddDemoContent />
    </Suspense>
  )
}
