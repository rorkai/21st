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
          // First check if demo exists
          console.log("Checking demo existence:", { demoId })
          const { data: existingDemo, error: checkError } = await client
            .from("demos")
            .select("id, component_id")
            .eq("id", demoId)

          console.log("Demo check result:", { existingDemo, checkError })

          if (checkError) {
            console.error("Error checking demo:", checkError)
            return
          }

          if (!existingDemo || existingDemo.length === 0) {
            console.error("Demo not found in database:", { demoId })
            return
          }

          const fileName = `${component.component_slug}.${demoId}.compiled.css`
          const url = await uploadToR2({
            file: {
              name: fileName,
              type: "text/plain",
              textContent: compiledCss,
            },
            fileKey: `${component.user_id}/${fileName}`,
            bucketName: "components-code",
          })
          console.log("Uploading CSS to demo:", { demoId, componentId: component.id, url })

          // First, let's verify the current state
          const { data: beforeUpdate } = await client
            .from("demos")
            .select("*")
            .eq("id", demoId)
            .single()

          console.log("State before update:", beforeUpdate)

          // Check if we have access to the demo
          const { data: demoAccess, error: accessError } = await client
            .from("demos")
            .select("id, component_id")
            .eq("id", demoId)
            .eq("component_id", component.id)
            .single()

          console.log("Demo access check:", { demoAccess, accessError })

          if (!demoAccess) {
            console.error(
              "No access to demo or demo doesn't belong to component:",
              {
                demoId,
                componentId: component.id,
              },
            )
            return
          }

          const { data: updateResult, error: updateError } = await client
            .from("demos")
            .update({
              compiled_css: url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", demoId)
            .eq("component_id", component.id)
            .select()

          console.log("Raw update result:", { updateResult, updateError })

          if (updateError) {
            console.error(
              "Failed to update demo with compiled CSS:",
              updateError,
            )
            return
          }

          if (!updateResult || updateResult.length === 0) {
            console.error("Update did not affect any rows:", { demoId, url })
            return
          }

          // Verify the update actually happened with a separate query
          const { data: afterUpdate, error: verifyError } = await client
            .from("demos")
            .select("*")
            .eq("id", demoId)
            .single()

          if (verifyError) {
            console.error("Failed to verify update:", verifyError)
            return
          }

          console.log("State after update:", afterUpdate)

          if (!afterUpdate || afterUpdate.compiled_css !== url) {
            console.error("Update verification failed:", {
              before: beforeUpdate?.compiled_css,
              after: afterUpdate?.compiled_css,
              expectedUrl: url,
              updateResult,
            })
          } else {
            console.log("Update successful and verified!")
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
