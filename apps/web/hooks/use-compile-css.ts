import { useEffect, useState } from "react"
import { uploadToR2 } from "@/lib/r2"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Component, Tag, User } from "@/types/global"
export const useCompileCss = (
  code: string,
  demoCode: string,
  registryDependencies: Record<string, string>,
  component: Component & { user: User } & { tags: Tag[] },
  tailwindConfig?: string,
  globalCss?: string,
  compiledCss?: string,
) => {
  const client = useClerkSupabaseClient()
  const [css, setCss] = useState<string | null>(compiledCss ?? null)
  useEffect(() => {
    if (css) return
    fetch("/api/compile-css", {
      method: "POST",
      body: JSON.stringify({
        code,
        demoCode,
        dependencies: Object.values(registryDependencies ?? {}),
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
        }
      }).then(async () => {
        if (component.id) {
          const fileName = `${component.component_slug}.compiled.css`
          const url = await uploadToR2({
            file: {
              name: fileName,
              type: "text/plain",
              textContent: css!,
            },
            fileKey: `${component.user_id}/${fileName}`,
            bucketName: "components",
          })
          await client.from("components").update({ compiled_css: url }).eq("id", component.id)
        }
      })
  }, [code, demoCode, registryDependencies, tailwindConfig, globalCss, component])

  return css
}
