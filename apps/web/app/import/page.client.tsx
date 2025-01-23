"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { toast } from "sonner"
import { FormData } from "@/components/features/publish/config/utils"
import { useTheme } from "next-themes"
import {
  extractDemoComponentNames,
  extractRegistryDependenciesFromImports,
  extractAmbigiousRegistryDependencies,
  extractNPMDependencies,
} from "@/lib/parsers"
import { UrlInput } from "@/components/features/import/components/url-input"
import { ImportForm } from "@/components/features/import/components/import-form"
import { ImportHeader } from "@/components/features/import/components/import-header"
import { SuccessDialog } from "@/components/features/publish/components/success-dialog"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WorkflowIcon } from "@/components/icons/workslow"
import { ResolveUnknownDependenciesAlertForm } from "@/components/features/publish/components/alerts"

interface RegistryComponent {
  name: string
  type: string
  files: Array<{
    name: string
    content: string
    type: string
  }>
  dependencies: string[]
  registryDependencies: string[]
  cssVars?: {
    light: Record<string, string>
    dark: Record<string, string>
  }
  tailwind?: {
    config?: any
  }
}

interface UrlFormData {
  url: string
}

const formatComponentName = (name: string) => {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function ImportPageClient() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(true)
  const [previewKey, setPreviewKey] = useState(() => Date.now().toString())
  const [currentDemoIndex] = useState(0)
  const [shouldBlurPreview, setShouldBlurPreview] = useState(false)
  const [formStep, setFormStep] = useState<"detailedForm" | "demoCode">(
    "detailedForm",
  )
  const [isEditingFromCard, setIsEditingFromCard] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const router = useRouter()
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDependenciesModal, setShowDependenciesModal] = useState(false)

  const urlForm = useForm<UrlFormData>({
    defaultValues: {
      url: "",
    },
  })

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      component_slug: "",
      description: "",
      website_url: "",
      registry: "ui",
      license: "mit",
      is_public: true,
      code: "",
      tailwind_config: "",
      globals_css: "",
      demos: [
        {
          name: "",
          demo_slug: "",
          demo_code: "",
          preview_image_data_url: "",
          preview_image_file: new File([], "placeholder"),
          preview_video_data_url: "",
          preview_video_file: new File([], "placeholder"),
          tags: [],
          demo_dependencies: {},
          demo_direct_registry_dependencies: [],
        },
      ],
      slug_available: false,
      unknown_dependencies: [],
      unknown_dependencies_with_metadata: [],
      direct_registry_dependencies: [],
    },
  })

  const handleDependenciesResolved = (resolvedDependencies: any[]) => {
    if (!form) {
      return
    }

    try {
      const nonDemoDependencies = resolvedDependencies.filter(
        (d) => !d.isDemoDependency,
      )
      const demoDependencies = resolvedDependencies.filter(
        (d) => d.isDemoDependency,
      )

      const currentDirectDeps =
        form.getValues("direct_registry_dependencies") || []

      const newDirectDeps = [
        ...new Set([
          ...currentDirectDeps,
          ...nonDemoDependencies.map((d) => `${d.username}/${d.slug}`),
        ]),
      ]
      form.setValue("direct_registry_dependencies", newDirectDeps)

      const currentDemoDeps =
        form.getValues(`demos.0.demo_direct_registry_dependencies`) || []

      const newDemoDeps = [
        ...new Set([
          ...currentDemoDeps,
          ...demoDependencies.map((d) => `${d.username}/${d.slug}`),
        ]),
      ]
      form.setValue(`demos.0.demo_direct_registry_dependencies`, newDemoDeps)

      form.setValue("unknown_dependencies", [])
      form.setValue("unknown_dependencies_with_metadata", [])

      setShowDependenciesModal(false)
    } catch (error) {
      console.error("Error resolving dependencies:", error)
    }
  }

  const handleFetch = async (url: string) => {
    try {
      setIsLoading(true)

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch component data")
      }

      const data = await response.json()

      if (!data.name || !data.files || data.files.length === 0) {
        throw new Error("Invalid component data received")
      }

      const componentFile = data.files[0]!
      if (!componentFile.content) {
        throw new Error("Component file content is missing")
      }

      const componentNames = extractDemoComponentNames(componentFile.content)
      const componentName = formatComponentName(data.name)
      const originalName = componentNames[0] || data.name

      // Extract all dependencies
      const directRegistryDependencyImports =
        extractRegistryDependenciesFromImports(componentFile.content)
      const ambigiousRegistryDependencies = Object.values(
        extractAmbigiousRegistryDependencies(componentFile.content),
      )
      const npmDependencies = extractNPMDependencies(componentFile.content)

      // Create demo code
      const demoCode = `import { ${originalName} } from "@/components/${data.type.replace("registry:", "")}/${data.name}"

const Demo = () => {
  return (
    <${originalName} />
  )
}
  
export default { Demo }`

      // Extract demo dependencies
      const demoDependencyImports =
        extractRegistryDependenciesFromImports(demoCode)
      const ambigiousDemoRegistryDependencies = Object.values(
        extractAmbigiousRegistryDependencies(demoCode),
      )
      const demoNpmDependencies = extractNPMDependencies(demoCode)

      // Combine all unknown dependencies
      const parsedUnknownDependencies = [
        ...ambigiousRegistryDependencies.map((d) => ({
          ...d,
          isDemoDependency: false,
        })),
        ...ambigiousDemoRegistryDependencies.map((d) => ({
          ...d,
          isDemoDependency: true,
        })),
      ]
        .map((d) => ({
          slugWithUsername: d.slug,
          registry: d.registry,
          isDemoDependency: d.isDemoDependency,
        }))
        .filter((d) => data.name !== d.slugWithUsername)
        .filter(
          (d) =>
            !(
              d.isDemoDependency
                ? demoDependencyImports
                : directRegistryDependencyImports
            ).includes(d.slugWithUsername),
        )

      form.reset({
        ...form.getValues(),
        name: componentName,
        component_slug: data.name,
        description: "",
        website_url: url,
        registry: data.type.replace("registry:", ""),
        license: "mit",
        is_public: true,
        code: componentFile.content,
        tailwind_config: data.tailwind?.config
          ? JSON.stringify(data.tailwind.config, null, 2)
          : "",
        globals_css: "",
        demos: [
          {
            name: "Default",
            demo_slug: "default",
            demo_code: demoCode,
            preview_image_data_url: "",
            preview_image_file: new File([], "placeholder"),
            preview_video_data_url: "",
            preview_video_file: new File([], "placeholder"),
            tags: [],
            demo_dependencies: {
              ...Object.fromEntries(
                (data.dependencies || []).map((dep: string) => [dep, "latest"]),
              ),
              ...demoNpmDependencies,
            },
            demo_direct_registry_dependencies: demoDependencyImports,
          },
        ],
        slug_available: false,
        unknown_dependencies: parsedUnknownDependencies.map(
          (d) => d.slugWithUsername,
        ),
        unknown_dependencies_with_metadata: parsedUnknownDependencies,
        direct_registry_dependencies: directRegistryDependencyImports,
      })

      if (parsedUnknownDependencies.length > 0) {
        setShowDependenciesModal(true)
      }

      setShowUrlInput(false)
      setFormStep("detailedForm")
      toast.success("Component fetched successfully")
    } catch (error) {
      console.error("Error fetching component:", error)
      toast.error("Failed to fetch component data")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/components/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to import component")
      }

      setIsSuccessDialogOpen(true)
    } catch (error) {
      console.error(error)
      toast.error("Failed to import component")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestartPreview = () => {
    setPreviewKey(Date.now().toString())
    setShouldBlurPreview(false)
  }

  const handleDemoCodeChange = (value: string) => {
    const demos = form.getValues("demos")
    if (!demos[currentDemoIndex]) return

    const updatedDemo = {
      ...demos[currentDemoIndex],
      demo_code: value,
    }

    demos[currentDemoIndex] = updatedDemo
    form.setValue("demos", demos)
    setShouldBlurPreview(true)
  }

  const handleEditDemoCode = () => {
    setFormStep("demoCode")
    setIsEditingFromCard(true)
  }

  const handleSaveDemoCode = () => {
    setFormStep("detailedForm")
    setIsEditingFromCard(false)
  }

  const handleGoToComponent = () => {
    router.push(`/${user?.username}/${form.getValues().component_slug}`)
  }

  const handleAddAnother = () => {
    form.reset()
    setShowUrlInput(true)
    setFormStep("detailedForm")
    setIsSuccessDialogOpen(false)
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col h-screen w-full">
        <ImportHeader
          showUrlInput={showUrlInput}
          isLoading={isLoading}
          onSubmit={form.handleSubmit(onSubmit)}
          formStep={formStep}
          isSubmitting={isSubmitting}
          onEditDemoCode={handleEditDemoCode}
          onSaveDemoCode={handleSaveDemoCode}
          isEditingFromCard={isEditingFromCard}
        />
        <div className="flex-1">
          {showUrlInput ? (
            <div className="flex items-center justify-center h-full w-full">
              <UrlInput
                form={urlForm}
                isLoading={isLoading}
                onFetch={handleFetch}
              />
            </div>
          ) : (
            <ImportForm
              form={form}
              isDarkTheme={isDarkTheme}
              currentDemoIndex={currentDemoIndex}
              previewKey={previewKey}
              shouldBlurPreview={shouldBlurPreview}
              onRestartPreview={handleRestartPreview}
              onDemoCodeChange={handleDemoCodeChange}
              formStep={formStep}
              onEditDemoCode={handleEditDemoCode}
              onSaveDemoCode={handleSaveDemoCode}
            />
          )}
        </div>
      </div>
      <SuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onAddAnother={handleAddAnother}
        onGoToComponent={handleGoToComponent}
        mode="component"
      />

      <Dialog
        open={showDependenciesModal}
        onOpenChange={setShowDependenciesModal}
      >
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <WorkflowIcon />
              <DialogTitle>Unknown Dependencies</DialogTitle>
            </div>
          </DialogHeader>
          <ResolveUnknownDependenciesAlertForm
            unknownDependencies={
              form?.watch("unknown_dependencies_with_metadata") || []
            }
            onBack={() => {
              setShowDependenciesModal(false)
            }}
            onDependenciesResolved={handleDependenciesResolved}
          />
        </DialogContent>
      </Dialog>
    </FormProvider>
  )
}
