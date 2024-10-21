import { useDebugMode } from "@/hooks/useDebugMode"
import {
  extractDemoComponentNames,
  extractNPMDependencies,
} from "@/utils/parsers"
import { generateSandpackFiles } from "@/utils/sandpack"
import {
  SandpackProvider,
  SandpackFileExplorer,
  SandpackCodeViewer,
} from "@codesandbox/sandpack-react/unstyled"
import { useQuery } from "@tanstack/react-query"
import React, { useMemo } from "react"

const SandpackPreview = React.lazy(() =>
  import("@codesandbox/sandpack-react/unstyled").then((module) => ({
    default: module.SandpackPreview,
  })),
)

export function PublishComponentPreview({
  code,
  demoCode,
  registryDependencies,
  componentSlug,
  isDarkTheme,
}: {
  code: string
  demoCode: string
  registryDependencies: Record<string, string>
  componentSlug: string
  isDarkTheme: boolean
}) {
  const isDebug = useDebugMode()

  const { data: registryDependenciesFiles } = useQuery({
    queryKey: ["registryDependencies", registryDependencies],
    queryFn: async () => {
      const promises = Object.entries(registryDependencies).flatMap(
        ([path, slugs]) => {
          const slugArray = Array.isArray(slugs) ? slugs : [slugs]
          return slugArray.map(async (slug) => {
            const fileName = `${slug.split("/").pop()}.tsx`
            const dependencyUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${component.user_id}/${fileName}`
            const response = await fetch(dependencyUrl)
            if (!response.ok) {
              console.error(
                `Error downloading file for ${slug}:`,
                response.statusText,
                dependencyUrl,
              )
              return { data: null, error: new Error(response.statusText) }
            }

            const code = await response.text()
            if (!code) {
              console.error(
                `Error loading internal dependency ${slug}: No code returned`,
              )
              return { data: null, error: new Error("No code returned") }
            }
            const fullPath = path.endsWith(".tsx") ? path : `${path}.tsx`
            return { data: { [fullPath]: code }, error: null }
          })
        },
      )
      const results = await Promise.all(promises)
      if (results.some((result) => result.error)) {
        throw new Error("Error loading registry dependencies")
      }
      return results
        .filter((result) => result?.data && typeof result.data === "object")
        .reduce(
          (acc, r) => ({
            ...acc,
            ...(r.data as Record<string, string>),
          }),
          {},
        )
    },
  })

  const demoComponentNames = useMemo(
    () => extractDemoComponentNames(demoCode),
    [demoCode],
  )

  const sandpackDefaultFiles = useMemo(() => {
    return generateSandpackFiles({
      demoComponentNames,
      componentSlug,
      relativeImportPath: `/components/ui`,
      code,
      demoCode,
      theme: isDarkTheme ? "dark" : "light",
    })
  }, [demoComponentNames, componentSlug, code, demoCode, isDarkTheme])

  const files = {
    ...sandpackDefaultFiles,
    ...registryDependenciesFiles,
  }

  const dependencies = useMemo(() => {
    return {
      ...extractNPMDependencies(code),
      ...extractNPMDependencies(demoCode),
    }
  }, [code, demoCode])

  const providerProps = {
    template: "react-ts" as const,
    files,
    customSetup: {
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        ...dependencies,
      },
    },
    options: {
      externalResources: [
        "https://cdn.tailwindcss.com",
        "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/css/combined-tailwind.css",
      ],
    },
  }

  return (
    <div className="w-full bg-[#FAFAFA] rounded-lg">
      <SandpackProvider {...providerProps}>
        <SandpackPreview />
        {isDebug && (
          <>
            <SandpackFileExplorer />
            <SandpackCodeViewer />
          </>
        )}
      </SandpackProvider>
    </div>
  )
}
