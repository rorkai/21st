import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/components/features/publish/config/utils"
import { DemoDetailsForm } from "@/components/features/publish/components/forms/demo-form"
import { NameSlugForm } from "@/components/features/publish/components/forms/component-details-form"
import { EditCodeFileCard } from "@/components/features/publish/components/edit-code-file-card"
import { DemoPreviewTabs } from "@/components/features/publish/components/preview-with-tabs"
import { EditorStep } from "@/components/features/publish/components/code-editor"
import { cn } from "@/lib/utils"

interface ImportFormProps {
  form: UseFormReturn<FormData>
  isDarkTheme: boolean
  currentDemoIndex: number
  previewKey: string
  shouldBlurPreview: boolean
  onRestartPreview: () => void
  onDemoCodeChange: (value: string) => void
  formStep: "detailedForm" | "demoCode"
  onEditDemoCode: () => void
  onSaveDemoCode: () => void
}

export function ImportForm({
  form,
  isDarkTheme,
  currentDemoIndex,
  previewKey,
  shouldBlurPreview,
  onRestartPreview,
  onDemoCodeChange,
  formStep,
  onEditDemoCode,
  onSaveDemoCode,
}: ImportFormProps) {
  const demoCode = form.watch(`demos.${currentDemoIndex}.demo_code`)
  const code = form.watch("code")
  const componentSlug = form.watch("component_slug")
  const registry = form.watch("registry")

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div
        className={cn(
          "border-r pointer-events-auto transition-[width] duration-300 max-h-screen overflow-y-auto",
          formStep === "demoCode" ? "w-1/2" : "w-1/3",
        )}
      >
        {formStep === "demoCode" ? (
          <EditorStep
            form={form}
            isDarkTheme={isDarkTheme}
            fieldName={`demos.${currentDemoIndex}.demo_code`}
            value={demoCode}
            onChange={onDemoCodeChange}
          />
        ) : (
          <div className="container py-8 px-4">
            <div className="space-y-8">
              <NameSlugForm
                form={form}
                isSlugReadOnly={false}
                placeholderName={form.watch("name")}
              />

              <EditCodeFileCard
                iconSrc="/demo-file.svg"
                mainText="Edit demo code"
                onEditClick={onEditDemoCode}
              />

              <DemoDetailsForm
                form={form}
                demoIndex={currentDemoIndex}
                mode="full"
              />
            </div>
          </div>
        )}
      </div>
      <div
        className={cn(
          "pointer-events-auto transition-[width] duration-300",
          formStep === "demoCode" ? "w-1/2" : "w-2/3",
        )}
      >
        {(!form.watch("unknown_dependencies") || form.watch("unknown_dependencies").length === 0) && (
          <DemoPreviewTabs
            code={code}
            slugToPublish={componentSlug}
            registryToPublish={registry}
            directRegistryDependencies={form.watch(
              "direct_registry_dependencies",
            )}
            demoDirectRegistryDependencies={form.watch(
              `demos.${currentDemoIndex}.demo_direct_registry_dependencies`,
            )}
            isDarkTheme={isDarkTheme}
            customTailwindConfig={form.watch("tailwind_config")}
            customGlobalCss={form.watch("globals_css")}
            form={form}
            shouldBlurPreview={shouldBlurPreview}
            onRestartPreview={onRestartPreview}
            formStep={formStep}
            previewKey={previewKey}
            currentDemoIndex={currentDemoIndex}
          />
        )}
      </div>
    </div>
  )
}
