"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ComponentDetailsForm } from "../features/publish/components/forms/component-form"
import {
  Component,
  User,
  Tag,
  DemoWithComponent,
  Demo,
  DemoWithTags,
} from "@/types/global"
import { useForm } from "react-hook-form"
import { FormData } from "../features/publish/config/utils"
import { uploadToR2 } from "@/lib/r2"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-media-query"
import { DemoDetailsForm } from "../features/publish/components/forms/demo-form"
import { Button } from "@/components/ui/button"
import { LoaderCircle } from "lucide-react"
import { EditCodeFileCard } from "../features/publish/components/edit-code-file-card"
import { useTheme } from "next-themes"
import { useState } from "react"
import { CodeEditorDialog } from "./code-editor-dialog"
import { addVersionToUrl } from "@/lib/utils/url"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const cleanInitialUrl = (url: string | null) => {
  if (!url) return ""
  return url.replace(/^(https?:\/\/)+(www\.)?/, "")
}

const sanitizeDependencies = (deps: unknown): string[] =>
  Array.isArray(deps) ? deps.filter(Boolean) : []

interface CommonEditorProps {
  code: string
  demoCode: string
  componentSlug: string
  registryToPublish: string
  customTailwindConfig?: string
  customGlobalCss?: string
  currentState: {
    code: string
    demoCode: string
    directRegistryDependencies: string[]
    demoDirectRegistryDependencies: string[]
    tailwindConfig?: string
    globalsCss?: string
  }
}

export function EditComponentDialog({
  component,
  demo,
  isOpen,
  setIsOpen,
  onUpdate,
}: {
  component: DemoWithComponent | (Component & { user: User })
  demo: DemoWithTags
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onUpdate: (
    _updatedData: Partial<Component>,
    demoUpdates: Partial<Demo> & { demo_tags?: Tag[] },
  ) => Promise<void>
}) {
  const isMobile = useIsMobile()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const componentData =
    "component" in component ? component.component : component

  const [isEditingCode, setIsEditingCode] = useState(false)
  const [isEditingDemo, setIsEditingDemo] = useState(false)
  const [isEditingStyles, setIsEditingStyles] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [demoCode, setDemoCode] = useState("")
  const [tailwindConfig, setTailwindConfig] = useState<string>()
  const [globalCss, setGlobalCss] = useState<string>()
  const [activeStyleTab, setActiveStyleTab] = useState<string>("tailwind")
  const [activeCodeTab, setActiveCodeTab] = useState<string>("component")

  const form = useForm<FormData>({
    defaultValues: {
      name: componentData.name,
      code: componentData.code,
      component_slug: componentData.component_slug,
      direct_registry_dependencies: [],
      demos: [
        {
          name: demo.name || "",
          demo_code: componentData.demo_code || "",
          demo_slug: "component" in component ? component.demo_slug : "default",
          preview_image_data_url: demo.preview_url || "",
          preview_video_data_url: demo.video_url || "",
          tags: demo.tags || [],
          demo_direct_registry_dependencies: [],
        },
      ],
      description: componentData.description ?? "",
      license: componentData.license,
      website_url: cleanInitialUrl(componentData.website_url ?? ""),
      is_public: true,
      unknown_dependencies: [],
      registry: componentData.registry,
      slug_available: true,
    },
  })

  const uploadToR2Mutation = useMutation({
    mutationFn: async ({ file, fileKey }: { file: File; fileKey: string }) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64Content = buffer.toString("base64")
      return uploadToR2({
        file: {
          name: fileKey,
          type: file.type,
          encodedContent: base64Content,
        },
        fileKey: fileKey,
        bucketName: "components-code",
        contentType: file.type,
      })
    },
    onError: (error) => {
      console.error("Failed to upload to R2:", error)
    },
  })

  const updateMutation = useMutation<
    void,
    Error,
    {
      componentId: number
      updatedData: Partial<Component>
      demoUpdates: Partial<Demo> & { demo_tags?: Tag[] }
    }
  >({
    mutationFn: async ({ componentId, updatedData, demoUpdates }) => {
      await onUpdate(updatedData, {
        id: demo.id,
        preview_url: demoUpdates.preview_url,
        video_url: demoUpdates.video_url,
        updated_at: new Date().toISOString(),
        ...demoUpdates,
      })
    },
    onSuccess: () => {
      setIsOpen(false)
      toast.success("Component updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update component. Please try again.")
    },
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    const demo = formData.demos[0]

    const componentUpdates: Partial<Component> = {}
    const demoUpdates: Partial<Demo & { demo_tags?: Tag[] }> = {}

    if (formData.name !== componentData.name) {
      componentUpdates.name = formData.name
    }
    if (formData.description !== componentData.description) {
      componentUpdates.description = formData.description
    }
    if (formData.license !== componentData.license) {
      componentUpdates.license = formData.license
    }
    if (formData.website_url !== componentData.website_url) {
      componentUpdates.website_url = formData.website_url
    }

    if (
      demo?.preview_image_file instanceof File &&
      demo.preview_image_file.size > 0
    ) {
      const fileExtension = demo.preview_image_file.name.split(".").pop()
      const baseFolder = `${componentData.user.id}/${componentData.component_slug}`
      const demoSlug =
        "component" in component ? component.demo_slug : "default"
      const demoFolder = `${baseFolder}/${demoSlug}`
      const fileKey = `${demoFolder}/preview.${fileExtension}`

      try {
        const previewImageUrl = await uploadToR2Mutation.mutateAsync({
          file: demo.preview_image_file,
          fileKey,
        })
        demoUpdates.preview_url = previewImageUrl
      } catch (error) {
        console.error("❌ Failed to upload image:", error)
        toast.error("Failed to upload image. Please try again.")
        return
      }
    }

    if (
      demo?.preview_video_file instanceof File &&
      demo.preview_video_file.size > 0
    ) {
      const baseFolder = `${componentData.user.id}/${componentData.component_slug}`
      const demoSlug =
        "component" in component ? component.demo_slug : "default"
      const demoFolder = `${baseFolder}/${demoSlug}`
      const fileKey = `${demoFolder}/video.mp4`
      try {
        const videoUrl = await uploadToR2Mutation.mutateAsync({
          file: demo.preview_video_file,
          fileKey,
        })
        demoUpdates.video_url = videoUrl
      } catch (error) {
        console.error("Failed to upload video:", error)
        toast.error("Failed to upload video. Please try again.")
        return
      }
    }

    const currentTags =
      "component" in component && "tags" in component.component
        ? component.component.tags
        : "tags" in component
          ? component.tags
          : []
    const newTags = demo?.tags || []

    if (JSON.stringify(currentTags) !== JSON.stringify(newTags)) {
      demoUpdates.demo_tags = newTags.map((tag) => ({
        id: tag.id!,
        name: tag.name,
        slug: tag.slug,
      }))
    }

    if (
      Object.keys(componentUpdates).length > 0 ||
      Object.keys(demoUpdates).length > 0
    ) {
      updateMutation.mutate({
        componentId: componentData.id,
        updatedData: componentUpdates,
        demoUpdates: {
          ...demoUpdates,
          demo_tags: demoUpdates.demo_tags,
        },
      })
    } else {
      setIsOpen(false)
      toast.info("No changes were made")
    }
  }

  const handleEditCode = async () => {
    try {
      const [
        codeResponse,
        demoResponse,
        tailwindConfigResponse,
        globalCssResponse,
      ] = await Promise.all([
        fetch(componentData.code),
        fetch(demo.demo_code),
        componentData.tailwind_config_extension
          ? fetch(componentData.tailwind_config_extension)
          : Promise.resolve(undefined),
        componentData.global_css_extension
          ? fetch(componentData.global_css_extension)
          : Promise.resolve(undefined),
      ])

      const [code, demoCode, tailwindConfig, globalCss] = await Promise.all([
        codeResponse.text(),
        demoResponse.text(),
        tailwindConfigResponse?.text() || "",
        globalCssResponse?.text() || "",
      ])

      setComponentCode(code)
      setDemoCode(demoCode)
      setTailwindConfig(tailwindConfig)
      setGlobalCss(globalCss)
      setIsEditingCode(true)
    } catch (error) {
      console.error("Error fetching component code:", error)
      toast.error("Failed to load component code")
    }
  }

  const handleEditDemo = async () => {
    try {
      const [
        componentResponse,
        demoResponse,
        tailwindConfigResponse,
        globalCssResponse,
      ] = await Promise.all([
        fetch(componentData.code),
        fetch(demo.demo_code),
        componentData.tailwind_config_extension
          ? fetch(componentData.tailwind_config_extension)
          : Promise.resolve(undefined),
        componentData.global_css_extension
          ? fetch(componentData.global_css_extension)
          : Promise.resolve(undefined),
      ])

      const [componentCode, demoCode, tailwindConfig, globalCss] =
        await Promise.all([
          componentResponse.text(),
          demoResponse.text(),
          tailwindConfigResponse?.text() || "",
          globalCssResponse?.text() || "",
        ])

      setComponentCode(componentCode)
      setDemoCode(demoCode)
      setTailwindConfig(tailwindConfig)
      setGlobalCss(globalCss)
      setIsEditingDemo(true)
    } catch (error) {
      console.error("Error fetching demo code:", error)
      toast.error("Failed to load demo code")
    }
  }

  const handleEditStyles = async () => {
    try {
      const [tailwindConfigResponse, globalCssResponse] = await Promise.all([
        componentData.tailwind_config_extension
          ? fetch(componentData.tailwind_config_extension)
          : Promise.resolve(undefined),
        componentData.global_css_extension
          ? fetch(componentData.global_css_extension)
          : Promise.resolve(undefined),
      ])

      const [tailwindConfig, globalCss] = await Promise.all([
        tailwindConfigResponse?.text() || "",
        globalCssResponse?.text() || "",
      ])

      setTailwindConfig(tailwindConfig)
      setGlobalCss(globalCss)
      setIsEditingStyles(true)
    } catch (error) {
      console.error("Error fetching styles:", error)
      toast.error("Failed to load styles")
    }
  }

  const handleSaveComponentCode = async (newCode: string) => {
    try {
      console.log("Saving new component code:", newCode)
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const timestamp = Date.now()
      const codeUrl = await uploadToR2({
        file: {
          name: "code.tsx",
          type: "text/plain",
          textContent: newCode,
        },
        fileKey: `${baseFolder}/code.${timestamp}.tsx`,
        bucketName: "components-code",
      })

      console.log("Original URL:", codeUrl)
      const versionedUrl = addVersionToUrl(codeUrl)
      console.log("Versioned URL:", versionedUrl)

      if (codeUrl) {
        // Обновляем компонент
        const { error: updateComponentError } = await supabase
          .from("components")
          .update({
            code: versionedUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", componentData.id)

        if (updateComponentError) {
          console.error("Error updating component:", updateComponentError)
          throw updateComponentError
        }

        // Обновляем все демо этого компонента
        const { error: updateDemosError } = await supabase
          .from("demos")
          .update({
            compiled_css: null,
            updated_at: new Date().toISOString(),
          })
          .eq("component_id", componentData.id)

        if (updateDemosError) {
          console.error("Error updating demos:", updateDemosError)
          throw updateDemosError
        }

        setComponentCode(newCode)
        toast.success("Component code updated successfully")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error saving component code:", error)
      toast.error("Failed to save component code")
      throw error
    }
  }

  const supabase = useClerkSupabaseClient()

  const handleSaveDemoCode = async (newCode: string) => {
    try {
      console.log("Saving new demo code:", newCode)
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const timestamp = Date.now()
      const demoCodeUrl = await uploadToR2({
        file: {
          name: "demo.tsx",
          type: "text/plain",
          textContent: newCode,
        },
        fileKey: `${baseFolder}/${demo.demo_slug}/code.demo.${timestamp}.tsx`,
        bucketName: "components-code",
      })

      console.log("Original Demo URL:", demoCodeUrl)
      const versionedDemoUrl = addVersionToUrl(demoCodeUrl)
      console.log("Versioned Demo URL:", versionedDemoUrl)

      if (demoCodeUrl) {
        // Обновляем демо напрямую через Supabase
        const { error: updateDemoError } = await supabase
          .from("demos")
          .update({
            demo_code: versionedDemoUrl,
            compiled_css: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", demo.id)

        if (updateDemoError) {
          console.error("Error updating demo:", updateDemoError)
          throw updateDemoError
        }

        // Обновляем компонент для сброса compiled_css
        const { error: updateComponentError } = await supabase
          .from("components")
          .update({
            compiled_css: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", componentData.id)

        if (updateComponentError) {
          console.error("Error updating component:", updateComponentError)
          throw updateComponentError
        }

        setDemoCode(newCode)
        toast.success("Demo code updated successfully")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error saving demo code:", error)
      toast.error("Failed to save demo code")
      throw error
    }
  }

  const handleSaveStyles = async (newCode: string) => {
    try {
      console.log(
        "Saving new styles:",
        newCode,
        "activeStyleTab:",
        activeStyleTab,
      )
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const timestamp = Date.now()

      if (isEditingStyles) {
        const [tailwindConfigUrl, globalCssUrl] = await Promise.all([
          uploadToR2({
            file: {
              name: "tailwind.config.js",
              type: "text/plain",
              textContent:
                activeStyleTab === "tailwind" ? newCode : tailwindConfig || "",
            },
            fileKey: `${baseFolder}/tailwind.config.${timestamp}.js`,
            bucketName: "components-code",
          }),
          uploadToR2({
            file: {
              name: "globals.css",
              type: "text/plain",
              textContent:
                activeStyleTab === "globals" ? newCode : globalCss || "",
            },
            fileKey: `${baseFolder}/globals.${timestamp}.css`,
            bucketName: "components-code",
          }),
        ])

        const versionedTailwindUrl = addVersionToUrl(tailwindConfigUrl)
        const versionedGlobalCssUrl = addVersionToUrl(globalCssUrl)

        if (tailwindConfigUrl && globalCssUrl) {
          // Обновляем компонент напрямую через Supabase
          const { error: updateError } = await supabase
            .from("components")
            .update({
              tailwind_config_extension: versionedTailwindUrl,
              global_css_extension: versionedGlobalCssUrl,
              compiled_css: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", componentData.id)

          if (updateError) {
            console.error("Error updating component:", updateError)
            throw updateError
          }

          if (activeStyleTab === "tailwind") {
            setTailwindConfig(newCode)
          } else {
            setGlobalCss(newCode)
          }
          toast.success("Styles updated successfully")
          window.location.reload()
        }
      }
    } catch (error) {
      console.error("Error saving styles:", error)
      toast.error("Failed to save styles")
      throw error
    }
  }

  const commonEditorProps: CommonEditorProps = {
    code: componentCode,
    demoCode: demoCode,
    componentSlug: componentData.component_slug,
    registryToPublish: componentData.registry,
    customTailwindConfig: tailwindConfig,
    customGlobalCss: globalCss,
    currentState: {
      code: componentCode,
      demoCode: demoCode,
      directRegistryDependencies: sanitizeDependencies(
        componentData.direct_registry_dependencies,
      ),
      demoDirectRegistryDependencies: sanitizeDependencies(
        demo.demo_direct_registry_dependencies,
      ),
      tailwindConfig: tailwindConfig,
      globalsCss: globalCss,
    },
  }

  const content = (
    <>
      <div className="space-y-6">
        <ComponentDetailsForm
          isEditMode={true}
          form={form}
          handleSubmit={handleSubmit}
          isSubmitting={
            uploadToR2Mutation.isPending || updateMutation.isPending
          }
        />
        <EditCodeFileCard
          iconSrc={isDarkTheme ? "/tsx-file-dark.svg" : "/tsx-file.svg"}
          mainText={`${componentData.name} code`}
          subText={`Component code`}
          onEditClick={handleEditCode}
        />
        <div className="mt-6">
          <DemoDetailsForm form={form} demoIndex={0} />
        </div>

        <div className="space-y-3 mt-6">
          <EditCodeFileCard
            iconSrc={isDarkTheme ? "/demo-file-dark.svg" : "/demo-file.svg"}
            mainText="Demo code"
            subText={demo.name || "Demo code"}
            onEditClick={handleEditDemo}
          />
          <EditCodeFileCard
            iconSrc={isDarkTheme ? "/css-file-dark.svg" : "/css-file.svg"}
            mainText="Custom styles"
            subText="Tailwind config and globals.css"
            onEditClick={handleEditStyles}
          />
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (uploadToR2Mutation.isPending || updateMutation.isPending) {
            return
          }
          setIsOpen(open)
        }}
      >
        <DrawerContent>
          <DrawerHeader className="mb-2 px-6">
            <div className="flex justify-between items-center">
              <DrawerTitle>Edit component</DrawerTitle>
              <Button
                onClick={handleSubmit}
                disabled={
                  uploadToR2Mutation.isPending || updateMutation.isPending
                }
              >
                {(uploadToR2Mutation.isPending || updateMutation.isPending) && (
                  <LoaderCircle
                    className="-ms-1 me-2 animate-spin"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}
                {uploadToR2Mutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : "Save"}
              </Button>
            </div>
          </DrawerHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100dvh-6rem)]">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <>
      {isEditingCode && (
        <CodeEditorDialog
          {...commonEditorProps}
          isOpen={isEditingCode}
          setIsOpen={setIsEditingCode}
          directRegistryDependencies={sanitizeDependencies(
            componentData.direct_registry_dependencies,
          )}
          onSave={handleSaveComponentCode}
          mode="component"
        />
      )}

      {isEditingDemo && (
        <CodeEditorDialog
          {...commonEditorProps}
          isOpen={isEditingDemo}
          setIsOpen={setIsEditingDemo}
          directRegistryDependencies={sanitizeDependencies(
            componentData.direct_registry_dependencies,
          )}
          demoDirectRegistryDependencies={sanitizeDependencies(
            demo.demo_direct_registry_dependencies,
          )}
          onSave={handleSaveDemoCode}
          mode="demo"
        />
      )}

      {isEditingStyles && (
        <CodeEditorDialog
          {...commonEditorProps}
          isOpen={isEditingStyles}
          setIsOpen={setIsEditingStyles}
          directRegistryDependencies={sanitizeDependencies(
            componentData.direct_registry_dependencies,
          )}
          onSave={handleSaveStyles}
          mode="styles"
        />
      )}

      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (uploadToR2Mutation.isPending || updateMutation.isPending) {
            return
          }
          setIsOpen(open)
        }}
      >
        <SheetContent
          side="right"
          className="px-0 pb-0 sm:max-w-lg [&_button[aria-label='Close']]:hidden"
          hideCloseButton
        >
          <SheetHeader className="min-h-12 border-b bg-background z-50 pointer-events-auto px-4 sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SheetTitle>Edit component</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    uploadToR2Mutation.isPending || updateMutation.isPending
                  }
                >
                  {(uploadToR2Mutation.isPending ||
                    updateMutation.isPending) && (
                    <LoaderCircle
                      className="-ms-1 me-2 animate-spin"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                  {uploadToR2Mutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : "Save"}
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-5rem)] px-6">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
