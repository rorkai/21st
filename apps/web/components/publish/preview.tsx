import { useDebugMode } from "@/hooks/useDebugMode"
import { Tables } from "@/types/supabase"
import { useClerkSupabaseClient } from "@/utils/clerk"
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
import { LoadingSpinner } from "../LoadingSpinner"

const SandpackPreview = React.lazy(() =>
  import("@codesandbox/sandpack-react/unstyled").then((module) => ({
    default: module.SandpackPreview,
  })),
)

export function PublishComponentPreview({
  code,
  demoCode,
  slugToPublish,
  registryToPublish = "ui",
  directRegistryDependencies,
  isDarkTheme,
}: {
  code: string
  demoCode: string
  slugToPublish: string
  registryToPublish: string
  directRegistryDependencies: string[]
  isDarkTheme: boolean
}) {
  const isDebug = useDebugMode()
  const supabase = useClerkSupabaseClient()

  const {
    data: allRegistryDependenciesFiles,
    error: registryDependenciesError,
    isLoading
  } = useQuery({
    queryKey: ["allRegistryDependencies", directRegistryDependencies],
    queryFn: async () => {
      const { data: dependencies, error } = await supabase
        .from("component_dependencies_closure")
        .select(
          `
          component_id!inner(component_slug),
          dependency_component_id,
          components:dependency_component_id (
            component_slug,
            registry,
            code,
            user:user_id (username)
          )
        `,
        )
        .in(
          "component_id.component_slug",
          directRegistryDependencies.map((dep) => dep.split("/")[1]),
        )
        .returns<
          {
            components: Partial<Tables<"components">> & {
              user: { username: string }
            }
          }[]
        >()

      if (error) throw new Error("Failed to fetch registry dependencies")

      if (dependencies.length !== directRegistryDependencies.length) {
        console.error(
          "Registry dependencies mismatch: not all dependencies are present",
          dependencies,
          directRegistryDependencies,
        )
        throw new Error(
          "Registry dependencies mismatch: not all dependencies are present",
        )
      }

      const r2FetchPromises = dependencies.map(async (dep) => {
        const {
          code: r2Link,
          component_slug,
          user: { username },
          registry,
        } = dep.components

        const response = await fetch(r2Link!)
        if (!response.ok) {
          console.error(
            `Error downloading file for ${component_slug}:`,
            response.statusText,
            r2Link,
          )
          return { data: null, error: new Error(response.statusText) }
        }

        const code = await response.text()
        if (!code) {
          console.error(
            `Error loading dependency ${username}/${component_slug}: No code returned`,
          )
          return { data: null, error: new Error("No code returned") }
        }

        const filePath = `/components/${registry}/${component_slug}.tsx`
        return { data: { [filePath]: code }, error: null }
      })

      const fileResults = await Promise.all(r2FetchPromises)
      if (fileResults.some((result) => result.error)) {
        throw new Error("Error loading registry dependencies")
      }

      return fileResults
        .filter((result) => result?.data && typeof result.data === "object")
        .reduce(
          (acc, r) => ({
            ...acc,
            ...(r.data as Record<string, string>),
          }),
          {},
        )
    },
    enabled: directRegistryDependencies.length > 0,
    refetchOnWindowFocus: false,
  })

  const demoComponentNames = useMemo(
    () => extractDemoComponentNames(demoCode),
    [demoCode],
  )

  const sandpackDefaultFiles = useMemo(() => {
    return generateSandpackFiles({
      demoComponentNames,
      componentSlug: slugToPublish,
      relativeImportPath: `/components/${registryToPublish}`,
      code,
      demoCode,
      theme: isDarkTheme ? "dark" : "light",
    })
  }, [
    demoComponentNames,
    slugToPublish,
    code,
    demoCode,
    isDarkTheme,
    registryToPublish,
  ])

  const files = {
    ...sandpackDefaultFiles,
    ...allRegistryDependenciesFiles,
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
    <div className="w-full h-full bg-[#FAFAFA] rounded-lg">
      {registryDependenciesError && (
        <div className="text-red-500">{registryDependenciesError.message}</div>
      )}
      {isLoading && <LoadingSpinner />}
      {!registryDependenciesError && !isLoading && (
        <SandpackProvider {...providerProps}>
          <SandpackPreview showSandpackErrorOverlay={false} />
          {isDebug && (
            <>
              <SandpackFileExplorer />
              <SandpackCodeViewer />
            </>
          )}
        </SandpackProvider>
      )}
    </div>
  )
}
