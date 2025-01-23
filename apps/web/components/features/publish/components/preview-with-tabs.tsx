import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React, { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PublishComponentPreview } from "./preview"
import { UseFormReturn } from "react-hook-form"
import type { FormData } from "../config/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FormStep } from "@/types/global"

interface DemoPreviewTabsProps {
  code: string
  slugToPublish: string
  registryToPublish: string
  directRegistryDependencies: string[]
  demoDirectRegistryDependencies: string[]
  isDarkTheme: boolean
  customTailwindConfig?: string
  customGlobalCss?: string
  form?: UseFormReturn<FormData>
  shouldBlurPreview?: boolean
  onRestartPreview?: () => void
  formStep?: FormStep
  previewKey?: string
  currentDemoIndex: number
  demoCode?: string
  demoDependencies?: Record<string, string>
}

export function DemoPreviewTabs({
  code,
  slugToPublish,
  registryToPublish,
  directRegistryDependencies,
  isDarkTheme,
  customTailwindConfig,
  customGlobalCss,
  form,
  shouldBlurPreview,
  onRestartPreview,
  formStep,
  previewKey,
  currentDemoIndex,
  demoCode,
  demoDependencies,
}: DemoPreviewTabsProps) {
  const demos = form?.watch("demos") || []


  const [activeTab, setActiveTab] = useState("demo-0")
  const [renderedTabs, setRenderedTabs] = useState<Set<string>>(
    new Set(["demo-0"]),
  )

  const [previewKeys, setPreviewKeys] = useState<Record<number, string>>({})

  const handleRestartPreview = () => {
    if (onRestartPreview) {
      onRestartPreview()
      setPreviewKeys((prev) => ({
        ...prev,
        [currentDemoIndex]: `${Date.now()}`,
      }))
    }
  }

  useEffect(() => {
    setActiveTab(`demo-${currentDemoIndex}`)
    setRenderedTabs((prev) => new Set([...prev, `demo-${currentDemoIndex}`]))
  }, [currentDemoIndex])

  useEffect(() => {
    if (demos.length === 0) {
      setActiveTab("demo-0")
      return
    }

    const currentIndex = parseInt(activeTab.replace("demo-", ""))
    if (currentIndex >= demos.length) {
      setActiveTab(`demo-${demos.length - 1}`)
    }
  }, [demos.length, activeTab])

  useEffect(() => {
    setRenderedTabs((prev) => new Set([...prev, activeTab]))
  }, [activeTab])

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col h-full"
      >
        {demos.length > 1 && (
          <TabsList className="h-auto gap-2 rounded-none bg-transparent px-4 py-2 overflow-x-auto scrollbar-none whitespace-nowrap">
            {demos.map((demo, index) => (
              <TabsTrigger
                key={index}
                value={`demo-${index}`}
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                {demo.name || `Demo ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <div className="relative flex-1 h-full">
          {demos.map((demo, index) => {
            const tabId = `demo-${index}`
            if (!renderedTabs.has(tabId)) {
              return null
            }

            return (
              <div
                key={index}
                className={cn(
                  "absolute inset-0 w-full h-full transition-opacity duration-300",
                  activeTab === tabId ? "opacity-100 z-10" : "opacity-0 z-0",
                )}
              >
                <React.Suspense fallback={<LoadingSpinner />}>
                  <div className="relative h-full">
                    <PublishComponentPreview
                      code={code}
                      demoCode={demo.demo_code ?? demoCode}
                      slugToPublish={slugToPublish}
                      registryToPublish={registryToPublish}
                      directRegistryDependencies={[
                        ...directRegistryDependencies,
                        ...(demo.demo_direct_registry_dependencies || []),
                      ]}
                      isDarkTheme={isDarkTheme}
                      customTailwindConfig={form?.getValues("tailwind_config")}
                      customGlobalCss={form?.getValues("globals_css")}
                      key={previewKeys[index] || previewKey}
                      demoDependencies={
                        demo.demo_dependencies || demoDependencies
                      }
                    />
                    {shouldBlurPreview &&
                      formStep === "demoCode" &&
                      currentDemoIndex === index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <Button
                            onClick={handleRestartPreview}
                            variant="secondary"
                            className="z-20"
                          >
                            Update Preview
                          </Button>
                        </div>
                      )}
                  </div>
                </React.Suspense>
              </div>
            )
          })}
        </div>
      </Tabs>
    </div>
  )
}
