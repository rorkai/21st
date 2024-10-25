"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ComponentDetailsForm } from "./publish/ComponentDetailsForm"
import { Component, User, Tag } from "@/types/global"
import { useForm } from "react-hook-form"
import { FormData } from "./publish/utils"
import { uploadToR2 } from "@/lib/r2"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function EditComponentDialog({
  component,
  isOpen,
  setIsOpen,
  onUpdate,
}: {
  component: Component & { user: User } & { tags: Tag[] }
  isOpen: boolean
  // eslint-disable-next-line no-unused-vars
  setIsOpen: (isOpen: boolean) => void
  onUpdate: (
    // eslint-disable-next-line no-unused-vars
    updatedData: Partial<Component & { tags?: Tag[] }>,
  ) => Promise<void>
}) {
  const form = useForm<FormData>({
    defaultValues: {
      name: component.name,
      code: component.code,
      demo_code: component.demo_code,
      component_slug: component.component_slug,
      direct_registry_dependencies: [],
      demo_direct_registry_dependencies: [],
      unknown_dependencies: [],
      slug_available: true,
      preview_image_data_url: component.preview_url,
      description: component.description ?? "",
      license: component.license,
      tags: component.tags,
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
        fileKey,
        bucketName: "components-code",
        contentType: file.type,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<Component & { tags?: Tag[] }>) => {
      await onUpdate(updatedData)
    },
    onSuccess: () => {
      setIsOpen(false)
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

    if (formData.description !== component.description) {
      updatedData.description = formData.description
    }

    if (formData.license !== component.license) {
      updatedData.license = formData.license
    }

    if (formData.tags !== component.tags) {
      updatedData.tags = formData.tags.map((tag) => ({
        id: tag.id!,
        name: tag.name,
        slug: tag.slug,
      }))
    }

    if (formData.preview_image_file instanceof File) {
      const fileExtension = formData.preview_image_file.name.split(".").pop()
      const fileKey = `${component.user.id}/${component.component_slug}.${fileExtension}`

      try {
        const previewImageUrl = await uploadToR2Mutation.mutateAsync({
          file: formData.preview_image_file,
          fileKey,
        })
        updatedData.preview_url = previewImageUrl
      } catch (error) {
        console.error("Failed to upload image:", error)
        toast.error("Failed to upload image. Please try again.")
        return
      }
    }

    updateMutation.mutate(updatedData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit component</DialogTitle>
        </DialogHeader>
        <ComponentDetailsForm
          isEditMode={true}
          form={form}
          handleSubmit={handleSubmit}
          isSubmitting={
            uploadToR2Mutation.isPending || updateMutation.isPending
          }
        />
      </DialogContent>
    </Dialog>
  )
}
