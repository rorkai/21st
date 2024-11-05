import { useDebugMode } from "@/hooks/use-debug-mode"
import { useClerkSupabaseClient } from "@/lib/clerk"
import {
  extractDemoComponentNames,
  extractNPMDependencies,
} from "@/lib/parsers"
import {
  BUNDLER_URL,
  defaultNPMDependencies as defaultSandpackDependencies,
  generateSandpackExternalResources,
  generateSandpackFiles,
} from "@/lib/sandpack"
import {
  SandpackProvider,
  SandpackFileExplorer,
  SandpackCodeViewer,
} from "@codesandbox/sandpack-react"
import { useQuery } from "@tanstack/react-query"
import React, { useMemo } from "react"
import { LoadingSpinner } from "../LoadingSpinner"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"

const SandpackPreview = React.lazy(() =>
  import("@codesandbox/sandpack-react").then((module) => ({
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
    data: registryDependencies,
    isLoading,
    error: registryDependenciesError,
  } = useQuery({
    queryKey: ["registryDependencies", directRegistryDependencies],
    queryFn: async () => {
      const { data, error } = await resolveRegistryDependencyTree({
        supabase,
        sourceDependencySlugs: directRegistryDependencies,
        withDemoDependencies: true,
      })
      if (error) {
        throw error
      }
      return data
    },
    enabled: directRegistryDependencies?.length > 0,
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
    ...Object.fromEntries(
      Object.entries(registryDependencies?.filesWithRegistry ?? {}).map(
        ([key, value]) => [key, value.code],
      ),
    ),
  }

  const dependencies = useMemo(() => {
    return {
      ...extractNPMDependencies(code),
      ...extractNPMDependencies(demoCode),
      ...(registryDependencies?.npmDependencies || {}),
    }
  }, [code, demoCode, registryDependencies?.npmDependencies])

  const providerProps = {
    template: "react-ts" as const,
    files,
    customSetup: {
      dependencies: {
        ...defaultSandpackDependencies,
        ...dependencies,
      },
    },
    options: {
      bundlerURL: BUNDLER_URL,
      externalResources: generateSandpackExternalResources({
        tailwindConfigExtensions: [],
        tailwindGlobalCSSExtensions: [],
      }),
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
          <SandpackPreview
            showSandpackErrorOverlay={false}
            showOpenInCodeSandbox={true}
          />
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
