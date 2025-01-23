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

const cleanInitialUrl = (url: string | null) => {
  if (!url) return ""
  return url.replace(/^(https?:\/\/)+(www\.)?/, "")
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
      const response = await fetch(demo.demo_code)
      const code = await response.text()
      setDemoCode(code)
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
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const codeUrl = await uploadToR2({
        file: {
          name: "code.tsx",
          type: "text/plain",
          textContent: newCode,
        },
        fileKey: `${baseFolder}/code.tsx`,
        bucketName: "components-code",
      })

      if (codeUrl) {
        await onUpdate({ code: addVersionToUrl(codeUrl) }, {})
        toast.success("Component code updated successfully")
      }
    } catch (error) {
      console.error("Error saving component code:", error)
      toast.error("Failed to save component code")
      throw error
    }
  }

  const handleSaveDemoCode = async (newCode: string) => {
    try {
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const demoCodeUrl = await uploadToR2({
        file: {
          name: "demo.tsx",
          type: "text/plain",
          textContent: newCode,
        },
        fileKey: `${baseFolder}/${demo.demo_slug}/code.demo.tsx`,
        bucketName: "components-code",
      })

      if (demoCodeUrl) {
        await onUpdate({}, { demo_code: addVersionToUrl(demoCodeUrl) })
        toast.success("Demo code updated successfully")
      }
    } catch (error) {
      console.error("Error saving demo code:", error)
      toast.error("Failed to save demo code")
      throw error
    }
  }

  const handleSaveStyles = async (newCode: string) => {
    try {
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`

      if (isEditingStyles) {
        const [tailwindConfigUrl, globalCssUrl] = await Promise.all([
          uploadToR2({
            file: {
              name: "tailwind.config.js",
              type: "text/plain",
              textContent:
                activeStyleTab === "tailwind" ? newCode : tailwindConfig || "",
            },
            fileKey: `${baseFolder}/tailwind.config.js`,
            bucketName: "components-code",
          }),
          uploadToR2({
            file: {
              name: "globals.css",
              type: "text/plain",
              textContent:
                activeStyleTab === "globals" ? newCode : globalCss || "",
            },
            fileKey: `${baseFolder}/globals.css`,
            bucketName: "components-code",
          }),
        ])

        if (tailwindConfigUrl && globalCssUrl) {
          await onUpdate(
            {
              tailwind_config_extension: addVersionToUrl(tailwindConfigUrl),
              global_css_extension: addVersionToUrl(globalCssUrl),
            },
            {},
          )
          toast.success("Styles updated successfully")
        }
      }
    } catch (error) {
      console.error("Error saving styles:", error)
      toast.error("Failed to save styles")
      throw error
    }
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
        <div className="mt-6">
          <DemoDetailsForm form={form} demoIndex={0} />
        </div>

        <div className="space-y-3 mt-6">
          <EditCodeFileCard
            iconSrc={isDarkTheme ? "/tsx-file-dark.svg" : "/tsx-file.svg"}
            mainText={`${componentData.name} code`}
            subText={`Component code`}
            onEditClick={handleEditCode}
          />
          <EditCodeFileCard
            iconSrc={isDarkTheme ? "/demo-file-dark.svg" : "/demo-file.svg"}
            mainText="Demo code"
            subText={demo.name}
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
          isOpen={isEditingCode}
          setIsOpen={setIsEditingCode}
          code={componentCode}
          demoCode={demoCode}
          componentSlug={componentData.component_slug}
          registryToPublish={componentData.registry}
          directRegistryDependencies={
            Array.isArray(componentData.direct_registry_dependencies)
              ? (componentData.direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : []
          }
          customTailwindConfig={tailwindConfig}
          customGlobalCss={globalCss}
          onSave={handleSaveComponentCode}
          mode="component"
          currentState={{
            code: componentCode,
            demoCode: demoCode,
            directRegistryDependencies: Array.isArray(
              componentData.direct_registry_dependencies,
            )
              ? (componentData.direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : [],
            demoDirectRegistryDependencies: Array.isArray(
              demo.demo_direct_registry_dependencies,
            )
              ? (demo.demo_direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : [],
            tailwindConfig: tailwindConfig,
            globalsCss: globalCss,
          }}
        />
      )}

      {isEditingDemo && (
        <CodeEditorDialog
          isOpen={isEditingDemo}
          setIsOpen={setIsEditingDemo}
          code={componentCode}
          demoCode={demoCode}
          componentSlug={componentData.component_slug}
          registryToPublish={componentData.registry}
          directRegistryDependencies={
            Array.isArray(componentData.direct_registry_dependencies)
              ? (componentData.direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : []
          }
          demoDirectRegistryDependencies={
            Array.isArray(demo.demo_direct_registry_dependencies)
              ? (demo.demo_direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : []
          }
          customTailwindConfig={tailwindConfig}
          customGlobalCss={globalCss}
          onSave={handleSaveDemoCode}
          mode="demo"
          currentState={{
            code: componentCode,
            demoCode: demoCode,
            directRegistryDependencies: Array.isArray(
              componentData.direct_registry_dependencies,
            )
              ? (componentData.direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : [],
            demoDirectRegistryDependencies: Array.isArray(
              demo.demo_direct_registry_dependencies,
            )
              ? (demo.demo_direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : [],
            tailwindConfig: tailwindConfig,
            globalsCss: globalCss,
          }}
        />
      )}

      {isEditingStyles && (
        <CodeEditorDialog
          isOpen={isEditingStyles}
          setIsOpen={setIsEditingStyles}
          code={componentCode}
          demoCode={demoCode}
          componentSlug={componentData.component_slug}
          registryToPublish={componentData.registry}
          directRegistryDependencies={
            Array.isArray(componentData.direct_registry_dependencies)
              ? (componentData.direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : []
          }
          customTailwindConfig={tailwindConfig}
          customGlobalCss={globalCss}
          onSave={handleSaveStyles}
          mode="styles"
          currentState={{
            code: componentCode,
            demoCode: demoCode,
            directRegistryDependencies: Array.isArray(
              componentData.direct_registry_dependencies,
            )
              ? (componentData.direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : [],
            demoDirectRegistryDependencies: Array.isArray(
              demo.demo_direct_registry_dependencies,
            )
              ? (demo.demo_direct_registry_dependencies as string[]).filter(
                  Boolean,
                )
              : [],
            tailwindConfig: tailwindConfig,
            globalsCss: globalCss,
          }}
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
          <SheetHeader className="mb-2 px-6">
            <div className="flex justify-between items-center">
              <SheetTitle>Edit component</SheetTitle>
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
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-5rem)] px-6">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
