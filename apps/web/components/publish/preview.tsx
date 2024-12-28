import { useDebugMode } from "@/hooks/use-debug-mode"
import { useClerkSupabaseClient } from "@/lib/clerk"
import {
  extractDemoComponentNames,
  extractNPMDependencies,
} from "@/lib/parsers"
import {
  defaultGlobalCss,
  defaultTailwindConfig,
  generateSandpackFiles,
} from "@/lib/sandpack"
import {
  SandpackProvider,
  SandpackFileExplorer,
  SandpackCodeViewer,
} from "@codesandbox/sandpack-react"
import { useQuery } from "@tanstack/react-query"
import React, { useMemo, useState, useEffect } from "react"
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
  customTailwindConfig,
  customGlobalCss,
}: {
  code: string
  demoCode: string
  slugToPublish: string
  registryToPublish: string
  directRegistryDependencies: string[]
  isDarkTheme: boolean
  customTailwindConfig?: string
  customGlobalCss?: string
}) {
  const isDebug = useDebugMode()
  const supabase = useClerkSupabaseClient()
  const [css, setCss] = useState<string | undefined>(undefined)

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

  const shellCode = useMemo(() => {
    const dummyFiles = generateSandpackFiles({
      demoComponentNames,
      componentSlug: slugToPublish,
      relativeImportPath: `/components/${registryToPublish}`,
      code,
      demoCode,
      theme: isDarkTheme ? "dark" : "light",
      css: "",
    })

    return Object.entries(dummyFiles)
      .filter(([key]) => /\.(tsx|jsx|ts|js)$/.test(key))
      .map(([, file]) => file)
  }, [
    demoComponentNames,
    slugToPublish,
    registryToPublish,
    code,
    demoCode,
    isDarkTheme,
  ])

  useEffect(() => {
    if (isLoading) return

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/compile-css`, {
      method: "POST",
      body: JSON.stringify({
        code,
        demoCode,
        baseTailwindConfig: defaultTailwindConfig,
        baseGlobalCss: defaultGlobalCss,
        customTailwindConfig,
        customGlobalCss,
        dependencies: [
          ...Object.values(registryDependencies?.filesWithRegistry ?? {}).map(
            (file) => file.code,
          ),
          ...shellCode,
        ],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCss(data.css)
      })
  }, [
    code,
    demoCode,
    customTailwindConfig,
    customGlobalCss,
    registryDependencies,
    shellCode,
  ])

  const sandpackDefaultFiles = useMemo(
    () =>
      generateSandpackFiles({
        demoComponentNames,
        componentSlug: slugToPublish,
        relativeImportPath: `/components/${registryToPublish}`,
        code,
        demoCode,
        theme: isDarkTheme ? "dark" : "light",
        css: css ?? "",
        customTailwindConfig,
        customGlobalCss,
      }),
    [
      demoComponentNames,
      slugToPublish,
      registryToPublish,
      code,
      demoCode,
      isDarkTheme,
      css,
      customTailwindConfig,
      customGlobalCss,
    ],
  )

  const files = useMemo(
    () => ({
      ...sandpackDefaultFiles,
      ...Object.fromEntries(
        Object.entries(registryDependencies?.filesWithRegistry ?? {}).map(
          ([key, value]) => [key, value.code],
        ),
      ),
    }),
    [sandpackDefaultFiles, registryDependencies?.filesWithRegistry],
  )

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
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        "tailwind-merge": "latest",
        clsx: "latest",
        "@radix-ui/react-select": "^1.0.0",
        "lucide-react": "latest",
        ...dependencies,
      },
    },
  }

  if (css === undefined || isLoading) return <LoadingSpinner />

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
