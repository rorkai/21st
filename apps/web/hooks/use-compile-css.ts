import { useEffect, useState } from "react"
import { uploadToR2 } from "@/lib/r2"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Component, Tag, User } from "@/types/global"
import { defaultTailwindConfig } from "@/lib/sandpack"
import { defaultGlobalCss } from "@/lib/sandpack"

export const useCompileCss = (
  code: string,
  demoCode: string,
  registryDependencies: Record<string, string>,
  component: Component & { user: User } & { tags: Tag[] },
  shellCode: string[],
  demoId: number,
  tailwindConfig?: string,
  globalCss?: string,
  compiledCss?: string | null,
) => {
  const client = useClerkSupabaseClient()
  const [css, setCss] = useState<string | null>(compiledCss ?? null)

  useEffect(() => {
    if (css) return
    if (!shellCode) return
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/compile-css`, {
      method: "POST",
      body: JSON.stringify({
        code,
        demoCode,
        baseTailwindConfig: defaultTailwindConfig,
        baseGlobalCss: defaultGlobalCss,
        dependencies: Object.values(registryDependencies ?? {}).concat(
          shellCode,
        ),
        customTailwindConfig: tailwindConfig,
        customGlobalCss: globalCss,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error)
        } else {
          setCss(data.css)
          return data.css
        }
      })
      .then(async (compiledCss) => {
        if (component.id && demoId) {
          const { data: existingDemo, error: checkError } = await client
            .from("demos")
            .select("id, component_id")
            .eq("id", demoId)

          if (checkError || !existingDemo || existingDemo.length === 0) {
            return
          }

          const fileName = `${component.component_slug}/${demoId}.compiled.css`
          const url = await uploadToR2({
            file: {
              name: fileName,
              type: "text/plain",
              textContent: compiledCss,
            },
            fileKey: `${component.user_id}/${fileName}`,
            bucketName: "components-code",
          })

          const { error: updateError } = await client
            .from("demos")
            .update({
              compiled_css: url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", demoId)
            .eq("component_id", component.id)

          if (updateError) {
            console.error(
              "Failed to update demo with compiled CSS:",
              updateError,
            )
          }
        }
      })
      .catch((error) => {
        console.error("Error in CSS compilation or upload:", error)
      })
  }, [
    code,
    demoCode,
    registryDependencies,
    tailwindConfig,
    globalCss,
    component,
    shellCode,
    demoId,
  ])

  return css
}
