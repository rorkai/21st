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
import { LoadingSpinner } from "../../../ui/loading-spinner"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { useToast } from "@/hooks/use-toast"

const SandpackPreview = React.lazy(() =>
  import("@codesandbox/sandpack-react").then((module) => ({
    default: module.SandpackPreview,
  })),
)

export function PublishComponentPreview({
  code,
  demoCode,
  slugToPublish,
  registryToPublish,
  directRegistryDependencies,
  isDarkTheme,
  customTailwindConfig,
  customGlobalCss,
  demoDependencies,
}: {
  code: string
  demoCode: string
  slugToPublish: string
  registryToPublish: string
  directRegistryDependencies: string[]
  isDarkTheme: boolean
  customTailwindConfig?: string
  customGlobalCss?: string
  demoDependencies?: Record<string, string>
}) {
  const isDebug = useDebugMode()
  const supabase = useClerkSupabaseClient()
  const [css, setCss] = useState<string | undefined>(undefined)
  const { toast } = useToast()

  const currentDemoCode = demoCode

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
        withDemoDependencies: false,
      })
      if (error) {
        throw error
      }
      return data
    },
    enabled: directRegistryDependencies?.length > 0,
  })

  const demoComponentNames = useMemo(
    () => extractDemoComponentNames(currentDemoCode),
    [currentDemoCode],
  )

  const shellCode = useMemo(() => {
    const dummyFiles = generateSandpackFiles({
      demoComponentNames,
      componentSlug: slugToPublish,
      relativeImportPath:
        registryToPublish === "hooks"
          ? "hooks"
          : `/components/${registryToPublish}`,
      code,
      demoCode: currentDemoCode,
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
    currentDemoCode,
    isDarkTheme,
  ])

  useEffect(() => {
    if (isLoading) return

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/compile-css`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        demoCode: currentDemoCode,
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
        if (data.error) {
          console.error("CSS compilation failed:", {
            error: data.error,
            details: data.details,
            code: data.code,
          })
          toast({
            title: "CSS Compilation Error",
            description: data.details || data.error,
            variant: "destructive",
          })
          throw new Error(
            `CSS compilation failed: ${data.details || data.error}`,
          )
        }
        setCss(data.css)
      })
      .catch((error) => {
        console.error("Failed to compile CSS:", error)
        toast({
          title: "Error",
          description:
            "Failed to compile CSS. Please check your code and try again.",
          variant: "destructive",
        })
      })
  }, [
    code,
    currentDemoCode,
    customTailwindConfig,
    customGlobalCss,
    registryDependencies,
    shellCode,
    toast,
  ])

  const sandpackDefaultFiles = useMemo(
    () =>
      generateSandpackFiles({
        demoComponentNames,
        componentSlug: slugToPublish,
        relativeImportPath:
          registryToPublish === "hooks"
            ? "hooks"
            : `/components/${registryToPublish}`,
        code,
        demoCode: currentDemoCode,
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
      currentDemoCode,
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
      ...extractNPMDependencies(currentDemoCode),
      ...(registryDependencies?.npmDependencies || {}),
      ...(demoDependencies || {}),
    }
  }, [
    code,
    currentDemoCode,
    registryDependencies?.npmDependencies,
    demoDependencies,
  ])

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
