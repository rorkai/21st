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
  tailwindConfig?: string,
  globalCss?: string,
  compiledCss?: string,
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
        if (component.id) {
          const fileName = `${component.component_slug}.compiled.css`
          const url = await uploadToR2({
            file: {
              name: fileName,
              type: "text/plain",
              textContent: compiledCss,
            },
            fileKey: `${component.user_id}/${fileName}`,
            bucketName: "components-code",
          })
          await client
            .from("components")
            .update({ compiled_css: url })
            .eq("id", component.id)
        }
      })
  }, [
    code,
    demoCode,
    registryDependencies,
    tailwindConfig,
    globalCss,
    component,
    shellCode,
  ])

  return css
}
