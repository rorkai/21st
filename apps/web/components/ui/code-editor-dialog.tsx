import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { LoaderCircle } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { EditorStep } from "../features/publish/components/code-editor"
import { DemoPreviewTabs } from "../features/publish/components/preview-with-tabs"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm, FormProvider } from "react-hook-form"
import { cn } from "@/lib/utils"

interface CodeEditorDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  code: string
  demoCode: string
  componentSlug: string
  registryToPublish: string
  directRegistryDependencies: string[]
  demoDirectRegistryDependencies?: string[]
  customTailwindConfig?: string
  customGlobalCss?: string
  onSave: (newCode: string) => Promise<void>
  mode: "component" | "demo" | "styles"
  currentState: {
    code: string
    demoCode: string
    directRegistryDependencies: string[]
    demoDirectRegistryDependencies?: string[]
    tailwindConfig?: string
    globalsCss?: string
  }
}

export function CodeEditorDialog({
  isOpen,
  setIsOpen,
  code,
  demoCode,
  componentSlug,
  registryToPublish,
  directRegistryDependencies,
  demoDirectRegistryDependencies = [],
  customTailwindConfig,
  customGlobalCss,
  onSave,
  mode,
  currentState,
}: CodeEditorDialogProps) {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [editedCode, setEditedCode] = useState(
    mode === "component"
      ? code
      : mode === "demo"
        ? demoCode
        : mode === "styles" && customTailwindConfig
          ? customTailwindConfig
          : "",
  )
  const [isSaving, setIsSaving] = useState(false)
  const [activeStyleTab, setActiveStyleTab] = useState<"tailwind" | "globals">(
    "tailwind",
  )

  const methods = useForm({
    defaultValues: {
      code: currentState.code,
      name: "",
      component_slug: componentSlug,
      registry: registryToPublish,
      demos: [
        {
          name: "",
          demo_code: currentState.demoCode,
          demo_slug: "",
          tags: [],
          preview_image_data_url: "",
          preview_video_data_url: "",
          demo_direct_registry_dependencies:
            currentState.demoDirectRegistryDependencies,
          demo_dependencies: {},
        },
      ],
      direct_registry_dependencies: currentState.directRegistryDependencies,
      tailwind_config: currentState.tailwindConfig,
      globals_css: currentState.globalsCss,
    },
  })

  const [previewKey, setPreviewKey] = useState<string>(
    () =>
      `${code}-${demoCode}-${customTailwindConfig}-${customGlobalCss}-${isDarkTheme}`,
  )

  const [currentStateValue, setCurrentStateValue] = useState(currentState)

  const handleCodeChange = (value: string) => {
    setEditedCode(value)
    if (mode === "component") {
      methods.setValue("code", value)
      setCurrentStateValue({
        ...currentStateValue,
        code: value,
      })
    } else if (mode === "demo") {
      methods.setValue("demos.0.demo_code", value)
      setCurrentStateValue({
        ...currentStateValue,
        demoCode: value,
      })
    }
    setPreviewKey(`${value}-${Date.now()}`)
  }

  const handleRestartPreview = () => {
    setPreviewKey(
      `${editedCode}-${demoCode}-${customTailwindConfig}-${customGlobalCss}-${isDarkTheme}-${Date.now()}`,
    )
    setShouldBlurPreview(false)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(editedCode)
      setIsOpen(false)
    } catch (error) {
      console.error("Error saving code:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const previewProps = {
    code: mode === "component" ? editedCode : currentStateValue.code,
    demoCode: mode === "demo" ? editedCode : currentStateValue.demoCode,
    directRegistryDependencies: currentStateValue.directRegistryDependencies,
    demoDirectRegistryDependencies:
      currentStateValue.demoDirectRegistryDependencies,
    customTailwindConfig:
      mode === "styles" && activeStyleTab === "tailwind"
        ? editedCode
        : currentStateValue.tailwindConfig,
    customGlobalCss:
      mode === "styles" && activeStyleTab === "globals"
        ? editedCode
        : currentStateValue.globalsCss,
  }

  return (
    <FormProvider {...methods}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="w-screen h-screen p-0 sm:max-w-none"
        >
          <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">
                  {mode === "component" && "Edit Component Code"}
                  {mode === "demo" && "Edit Demo Code"}
                  {mode === "styles" && "Edit Styles"}
                </h2>
                {mode === "styles" && (
                  <Tabs
                    value={activeStyleTab}
                    onValueChange={(v) =>
                      setActiveStyleTab(v as "tailwind" | "globals")
                    }
                  >
                    <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground">
                      <TabsTrigger
                        value="tailwind"
                        className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                      >
                        tailwind.config.js
                      </TabsTrigger>
                      <TabsTrigger
                        value="globals"
                        className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
                      >
                        globals.css
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && (
                    <LoaderCircle
                      className="-ms-1 me-2 animate-spin"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/2 border-r">
                <EditorStep
                  form={methods}
                  isDarkTheme={isDarkTheme}
                  fieldName={mode === "demo" ? "demos.0.demo_code" : "code"}
                  value={editedCode}
                  onChange={handleCodeChange}
                />
              </div>
              <div className="w-1/2">
                <DemoPreviewTabs
                  key={previewKey}
                  {...previewProps}
                  slugToPublish={componentSlug}
                  registryToPublish={registryToPublish}
                  isDarkTheme={isDarkTheme}
                  form={methods}
                  shouldBlurPreview={false}
                  onRestartPreview={() => {
                    setPreviewKey(`${editedCode}-${Date.now()}`)
                  }}
                  formStep="code"
                  previewKey={previewKey}
                  currentDemoIndex={0}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </FormProvider>
  )
}
