import React, { useState, useRef, Suspense } from "react"
import { useAnimation, motion } from "framer-motion"
import { useAtom } from "jotai"
import { useTheme } from "next-themes"
import {
  CheckIcon,
  CopyIcon,
  Pencil,
  CodeXml,
  Info,
  ChevronDown,
} from "lucide-react"

import { ComponentPageInfo } from "./ComponentPageInfo"
import { Icons } from "@/components/icons"
import { LoadingSpinner } from "./LoadingSpinner"
import { CopyCodeButton } from "./CopyCodeButton"
import { isShowCodeAtom } from "./ComponentPage"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextMorph } from "@/components/ui/text-morph"

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeViewer,
  SandpackFileExplorer,
  SandpackProviderProps,
} from "@codesandbox/sandpack-react"
import { SandpackProvider as SandpackProviderUnstyled } from "@codesandbox/sandpack-react/unstyled"

import { useDebugMode } from "@/hooks/use-debug-mode"
import { useCompileCss } from "@/hooks/use-compile-css"
import { useIsMobile } from "@/hooks/use-media-query"

import { Component, Tag, User } from "@/types/global"
import { generateSandpackFiles } from "@/lib/sandpack"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { getPackageRunner, cn } from "@/lib/utils"
import { toast } from "sonner"

import styles from "./ComponentPreview.module.css"

const SandpackPreview = React.lazy(() =>
  import("@codesandbox/sandpack-react/unstyled").then((module) => ({
    default: module.SandpackPreview,
  })),
)

export function ComponentPagePreview({
  component,
  code,
  demoCode,
  dependencies,
  demoDependencies,
  demoComponentNames,
  registryDependencies,
  npmDependenciesOfRegistryDependencies,
  tailwindConfig,
  globalCss,
  compiledCss,
  canEdit,
  setIsEditDialogOpen,
}: {
  component: Component & { user: User } & { tags: Tag[] }
  code: string
  demoCode: string
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  demoComponentNames: string[]
  registryDependencies: Record<string, string>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  tailwindConfig?: string
  globalCss?: string
  compiledCss?: string
  canEdit: boolean
  setIsEditDialogOpen: (value: boolean) => void
}) {
  const sandpackRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [isShowCode, setIsShowCode] = useAtom(isShowCodeAtom)
  const isDebug = useDebugMode()

  const dumySandpackFiles = generateSandpackFiles({
    demoComponentNames,
    componentSlug: component.component_slug,
    relativeImportPath: `/components/${component.registry}`,
    code,
    demoCode,
    theme: isDarkTheme ? "dark" : "light",
    css: "",
  })

  const shellCode = Object.entries(dumySandpackFiles)
    .filter(
      ([key]) =>
        key.endsWith(".tsx") ||
        key.endsWith(".jsx") ||
        key.endsWith(".ts") ||
        key.endsWith(".js"),
    )
    .map(([, file]) => file)

  const css = useCompileCss(
    code,
    demoCode,
    registryDependencies,
    component,
    shellCode,
    tailwindConfig,
    globalCss,
    compiledCss,
  )

  const files = {
    ...generateSandpackFiles({
      demoComponentNames,
      componentSlug: component.component_slug,
      relativeImportPath: `/components/${component.registry}`,
      code,
      demoCode,
      theme: isDarkTheme ? "dark" : "light",
      css: css || "",
      customTailwindConfig: tailwindConfig,
      customGlobalCss: globalCss,
    }),
    ...registryDependencies,
  }

  const mainComponentFile = Object.keys(files).find((file) =>
    file.endsWith(`${component.component_slug}.tsx`),
  )

  const demoComponentFile = Object.keys(files).find((file) =>
    file.endsWith(`demo.tsx`),
  )

  const [activeFile, setActiveFile] = useState<string>(
    demoComponentFile ?? mainComponentFile ?? "",
  )

  const [previewError, setPreviewError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!css)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 w-full">
        <LoadingSpinner />
        <p className="text-muted-foreground text-sm">
          Preparing styles and dependencies...
        </p>
        <p className="text-muted-foreground/60 text-xs">
          This may take a few seconds on first load
        </p>
      </div>
    )

  const visibleFiles = [
    demoComponentFile,
    mainComponentFile,
    ...(tailwindConfig ? ["tailwind.config.js"] : []),
    ...(globalCss ? ["globals.css"] : []),
    ...Object.keys(registryDependencies).filter(
      (file) => file !== mainComponentFile,
    ),
  ].filter((file): file is string => file !== undefined)

  const customFileLabels = Object.fromEntries(
    Object.keys(registryDependencies).map((path) => {
      const parts = path.split("/")
      const fileName = parts[parts.length - 1]
      return [path, `${fileName} (dependency)`]
    }),
  )

  const providerProps: SandpackProviderProps = {
    theme: isDarkTheme ? "dark" : "light",
    template: "react-ts" as const,
    files: files,
    customSetup: {
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        "@radix-ui/react-select": "^1.0.0",
        "lucide-react": "latest",
        "tailwind-merge": "latest",
        clsx: "latest",
        ...dependencies,
        ...demoDependencies,
        ...npmDependenciesOfRegistryDependencies,
      },
    },
    options: {
      activeFile,
      visibleFiles,
    },
    ...({ fileLabels: customFileLabels } as any),
  }

  return (
    <div className="h-full w-full flex gap-2 rounded-lg min-h-90vh md:flex-row flex-col">
      <SandpackProviderUnstyled {...providerProps}>
        <motion.div
          layout
          className="flex-grow h-full relative"
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={<LoadingSpinner text="Loading preview..." />}>
            {previewError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-muted-foreground text-sm">
                  Failed to load preview
                </p>
                <button
                  onClick={() => {
                    setPreviewError(false)
                    setIsLoading(true)
                  }}
                  className="text-sm underline text-muted-foreground hover:text-foreground"
                >
                  Try again
                </button>
              </div>
            ) : (
              <SandpackPreview
                showSandpackErrorOverlay={false}
                showOpenInCodeSandbox={process.env.NODE_ENV === "development"}
                showRefreshButton={false}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setPreviewError(true)
                  setIsLoading(false)
                }}
              />
            )}
          </Suspense>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <LoadingSpinner text="Starting preview..." />
            </div>
          )}
        </motion.div>
      </SandpackProviderUnstyled>
      <div className="h-full w-full md:max-w-[30%] min-h-90vh overflow-hidden rounded-lg border border-border min-w-[350px] dark:bg-[#151515]">
        <SandpackProvider {...providerProps}>
          <div ref={sandpackRef} className="h-full w-full flex relative">
            <SandpackLayout className="flex w-full flex-row gap-4">
              <div className={`flex flex-col w-full ${styles.customScroller}`}>
                <MobileControls
                  isShowCode={isShowCode}
                  setIsShowCode={setIsShowCode}
                  canEdit={canEdit}
                  setIsEditDialogOpen={setIsEditDialogOpen}
                />
                <div className="flex w-full flex-col">
                  {isShowCode ? (
                    <>
                      <CopyCommandSection component={component} />
                      {isDebug && <SandpackFileExplorer />}
                      <div
                        className={`overflow-auto ${styles.codeViewerWrapper} relative`}
                      >
                        <CopyCodeButton />
                        <Tabs value={activeFile} onValueChange={setActiveFile}>
                          <TabsList className="h-9 relative bg-muted dark:bg-background justify-start w-full gap-0.5 pb-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border px-4 overflow-x-auto flex-nowrap hide-scrollbar">
                            {visibleFiles.map((file) => (
                              <TabsTrigger
                                key={file}
                                value={file}
                                className="overflow-hidden data-[state=active]:rounded-b-none dark:data-[state=active]:bg-muted data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-border bg-muted dark:bg-background py-2 data-[state=active]:z-10 data-[state=active]:shadow-none flex-shrink-0 whitespace-nowrap"
                              >
                                {file.split("/").pop()}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          <div className="">
                            <SandpackCodeViewer
                              wrapContent={true}
                              showTabs={false}
                            />
                          </div>
                        </Tabs>
                      </div>
                    </>
                  ) : (
                    <ComponentPageInfo component={component} />
                  )}
                </div>
              </div>
            </SandpackLayout>
          </div>
        </SandpackProvider>
      </div>
      {isDebug && (
        <div className="absolute top-0 left-0 bg-background text-foreground p-2 z-50">
          Debug Mode
        </div>
      )}
    </div>
  )
}

function CopyCommandSection({
  component,
}: {
  component: Component & { user: User }
}) {
  const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${component.user.username}/${component.component_slug}`
  const [copied, setCopied] = useState(false)
  const [selectedPackageManager, setSelectedPackageManager] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("preferredPackageManager") || "npm"
      : "npm",
  )

  const controls = useAnimation()

  const copyCommand = () => {
    const runner = getPackageRunner(selectedPackageManager)
    const command = `${runner} shadcn@latest add "${installUrl}"`
    navigator?.clipboard?.writeText(command)
    setCopied(true)
    trackEvent(AMPLITUDE_EVENTS.COPY_INSTALL_COMMAND, {
      componentId: component.id,
      componentName: component.name,
      packageManager: selectedPackageManager,
      installUrl,
    })
    setTimeout(() => setCopied(false), 1000)
    toast("Command copied to clipboard")
  }

  const handlePackageManagerChange = (pm: string) => {
    setSelectedPackageManager(pm)
    localStorage.setItem("preferredPackageManager", pm)
  }

  return (
    <div className="p-4 bg-muted dark:bg-background">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[14px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          Install component
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
            <TextMorph className="text-sm">{selectedPackageManager}</TextMorph>
            <ChevronDown
              className="ml-1.5 -mr-1 opacity-70"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[--radix-dropdown-menu-trigger-width]"
          >
            <DropdownMenuItem onClick={() => handlePackageManagerChange("npm")}>
              npm
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePackageManagerChange("yarn")}
            >
              yarn
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePackageManagerChange("pnpm")}
            >
              pnpm
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePackageManagerChange("bun")}>
              bun
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className="mb-2 mt-4 p-4 h-14 rounded-lg border bg-zinc-950 dark:bg-zinc-900 flex items-center"
        onMouseEnter={() => controls.start("hover")}
        onMouseLeave={() => controls.start("normal")}
      >
        <div className="flex items-center justify-center text-white w-5 h-5 mr-3">
          <Icons.terminal size={20} controls={controls} />
        </div>
        <div className="flex-grow overflow-scroll scrollbar-hide">
          <code className="flex items-center whitespace-nowrap font-mono text-sm">
            <span className="mr-2 text-white">
              {getPackageRunner(selectedPackageManager)}
            </span>
            <span className="text-muted-foreground">
              shadcn@latest add "{installUrl}"
            </span>
          </code>
        </div>
        <button
          onClick={copyCommand}
          className="flex-shrink-0 ml-3 flex items-center justify-center p-1 hover:bg-zinc-800 text-white w-8 h-8 rounded-md relative"
        >
          <div
            className={cn(
              "transition-all absolute",
              copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
            )}
          >
            <CheckIcon size={16} className="stroke-emerald-500" />
          </div>
          <div
            className={cn(
              "transition-all absolute",
              copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
            )}
          >
            <CopyIcon size={16} />
          </div>
        </button>
      </div>
    </div>
  )
}

const MobileControls = ({
  isShowCode,
  setIsShowCode,
  canEdit,
  setIsEditDialogOpen,
}: {
  isShowCode: boolean
  setIsShowCode: (value: boolean) => void
  canEdit: boolean
  setIsEditDialogOpen: (value: boolean) => void
}) => {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <div className="flex items-center gap-2 p-4 md:hidden">
      <div className="relative bg-muted rounded-lg h-8 p-0.5 flex flex-1">
        <div
          className="absolute inset-y-0.5 rounded-md bg-background shadow transition-all duration-200 ease-in-out"
          style={{
            width: "calc(50% - 2px)",
            left: isShowCode ? "2px" : "calc(50%)",
          }}
        />
        <button
          onClick={() => setIsShowCode(true)}
          className={`relative z-2 px-2 flex-1 flex items-center justify-center transition-colors duration-200 ${
            isShowCode ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <CodeXml size={18} />
          <span className="text-[14px] pl-1">Code</span>
        </button>
        <button
          onClick={() => setIsShowCode(false)}
          className={`relative z-2 px-2 flex-1 flex items-center justify-center transition-colors duration-200 ${
            !isShowCode ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Info size={18} />
          <span className="pl-1 text-[14px]">Info</span>
        </button>
      </div>
      {canEdit && (
        <button
          onClick={() => setIsEditDialogOpen(true)}
          className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Pencil size={16} />
          </div>
        </button>
      )}
    </div>
  )
}

export default ComponentPagePreview
