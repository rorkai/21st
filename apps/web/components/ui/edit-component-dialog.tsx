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
  const componentData =
    "component" in component ? component.component : component

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
                {uploadToR2Mutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : "Save"}
              </Button>
            </div>
          </DrawerHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100dvh-6rem)]">
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
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
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
              {uploadToR2Mutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </div>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-5rem)] px-6">
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
