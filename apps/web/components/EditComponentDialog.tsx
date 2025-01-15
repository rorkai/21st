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
import { ComponentDetailsForm } from "./publish/ComponentDetailsForm"
import { Component, User, Tag, DemoWithComponent } from "@/types/global"
import { useForm } from "react-hook-form"
import { FormData } from "./publish/utils"
import { uploadToR2 } from "@/lib/r2"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-media-query"

export function EditComponentDialog({
  component,
  isOpen,
  setIsOpen,
  onUpdate,
}: {
  component: DemoWithComponent | (Component & { user: User } & { tags: Tag[] })
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onUpdate: (
    updatedData: Partial<Component & { tags?: Tag[] }>,
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
          name: componentData.name,
          demo_code: componentData.demo_code || "",
          preview_image_data_url: componentData.preview_url || "",
          preview_video_data_url: componentData.video_url || "",
          tags: "tags" in component ? component.tags : [],
          demo_direct_registry_dependencies: Array.isArray(
            componentData.demo_direct_registry_dependencies,
          )
            ? componentData.demo_direct_registry_dependencies.map((dep) =>
                String(dep),
              )
            : [],
        },
      ],
      description: componentData.description ?? "",
      license: componentData.license,
      website_url: componentData.website_url ?? "",
      is_public: true,
      unknown_dependencies: [],
      registry: componentData.registry,
      slug_available: true,
    },
  })

  const uploadToR2Mutation = useMutation({
    mutationFn: async ({ file, fileKey }: { file: File; fileKey: string }) => {
      const actualFileKey = `${component.user.id}/${fileKey}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64Content = buffer.toString("base64")
      return uploadToR2({
        file: {
          name: actualFileKey,
          type: file.type,
          encodedContent: base64Content,
        },
        fileKey: actualFileKey,
        bucketName: "components-code",
        contentType: file.type,
      })
    },
    onError: (error) => {
      console.error("Failed to upload to R2:", error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<Component & { tags?: Tag[] }>) => {
      await onUpdate(updatedData)
    },
    onSuccess: () => {
      setIsOpen(false)
      toast.success("Component updated successfully")
    },
    onError: (error) => {
      console.error("Failed to update component:", error)
      toast.error("Failed to update component. Please try again.")
    },
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()

    const updatedData: Partial<Component & { tags?: Tag[] }> = {}

    if (formData.name !== component.name) {
      updatedData.name = formData.name
    }

    if (formData.description !== componentData.description) {
      updatedData.description = formData.description
    }

    if (formData.license !== componentData.license) {
      updatedData.license = formData.license
    }

    if (formData.website_url !== componentData.website_url) {
      updatedData.website_url = formData.website_url
    }

    if (
      formData.demos[0]?.tags !== ("tags" in component ? component.tags : [])
    ) {
      updatedData.tags = formData.demos[0]?.tags.map((tag) => ({
        id: tag.id!,
        name: tag.name,
        slug: tag.slug,
      }))
    }

    if (formData.demos[0]?.preview_image_file instanceof File) {
      const fileExtension = formData.demos[0]?.preview_image_file.name
        .split(".")
        .pop()
      const fileKey = `${componentData.component_slug}.${fileExtension}`

      try {
        const previewImageUrl = await uploadToR2Mutation.mutateAsync({
          file: formData.demos[0]?.preview_image_file,
          fileKey,
        })
        updatedData.preview_url = previewImageUrl
      } catch (error) {
        console.error("Failed to upload image:", error)
        toast.error("Failed to upload image. Please try again.")
        return
      }
    }

    if (formData.demos[0]?.preview_video_file instanceof File) {
      const fileKey = `${componentData.component_slug}.mp4`
      try {
        const videoUrl = await uploadToR2Mutation.mutateAsync({
          file: formData.demos[0]?.preview_video_file,
          fileKey,
        })
        updatedData.video_url = videoUrl
      } catch (error) {
        console.error("Failed to upload video:", error)
        toast.error("Failed to upload video. Please try again.")
        return
      }
    }

    updateMutation.mutate(updatedData)
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
            <DrawerTitle>Edit component</DrawerTitle>
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
      <SheetContent side="right" className="px-0 pb-0 sm:max-w-lg">
        <SheetHeader className="mb-2 px-6">
          <SheetTitle>Edit component</SheetTitle>
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
