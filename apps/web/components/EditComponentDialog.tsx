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
import { uploadToR2 } from "@/utils/r2"
import { useState } from "react"

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
      unknown_dependencies: [],
      slug_available: true,
      preview_image_data_url: component.preview_url,
      description: component.description ?? "",
      license: component.license,
      tags: component.tags,
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    setIsSubmitting(true)

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
      const buffer = Buffer.from(
        await formData.preview_image_file.arrayBuffer(),
      )
      const base64Content = buffer.toString("base64")
      const previewImageUrl = await uploadToR2({
        file: {
          name: fileKey,
          type: formData.preview_image_file.type,
          encodedContent: base64Content,
        },
        fileKey,
        bucketName: "components-code",
        contentType: formData.preview_image_file.type,
      })
      updatedData.preview_url = previewImageUrl
    }

    await onUpdate(updatedData)
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
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
