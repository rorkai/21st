import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React, { useState, useEffect } from "react"
import { LoadingSpinner } from "../LoadingSpinner"
import { PublishComponentPreview } from "./preview"
import { UseFormReturn } from "react-hook-form"
import type { FormData } from "./utils"
import { cn } from "@/lib/utils"

interface DemoPreviewTabsProps {
  code: string
  slugToPublish: string
  registryToPublish: string
  directRegistryDependencies: string[]
  demoDirectRegistryDependencies: string[]
  isDarkTheme: boolean
  customTailwindConfig?: string
  customGlobalCss?: string
  form: UseFormReturn<FormData>
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
}: DemoPreviewTabsProps) {
  const demos = form.watch("demos") || []
  const [activeTab, setActiveTab] = useState("demo-0")
  const [renderedTabs, setRenderedTabs] = useState<Set<string>>(
    new Set(["demo-0"]),
  )

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
        <TabsList className="h-auto gap-2 rounded-none bg-transparent px-4 py-2">
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
                  <PublishComponentPreview
                    code={code}
                    demoCode={demo.demo_code}
                    slugToPublish={slugToPublish}
                    registryToPublish={registryToPublish}
                    directRegistryDependencies={[
                      ...directRegistryDependencies,
                      ...(demo.demo_direct_registry_dependencies || []),
                    ]}
                    isDarkTheme={isDarkTheme}
                    customTailwindConfig={customTailwindConfig}
                    customGlobalCss={customGlobalCss}
                  />
                </React.Suspense>
              </div>
            )
          })}
        </div>
      </Tabs>
    </div>
  )
}
