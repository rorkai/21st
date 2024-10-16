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
  onClose,
  onUpdate,
}: {
  component: Component & { user: User } & { tags: Tag[] }
  isOpen: boolean
  // eslint-disable-next-line no-unused-vars
  setIsOpen: (isOpen: boolean) => void
  onClose: () => void
  // eslint-disable-next-line no-unused-vars
  onUpdate: (
    updatedData: Partial<Component & { tags?: Tag[] }>,
  ) => Promise<void>
}) {
  const form = useForm<FormData>({
    defaultValues: {
      name: component.name,
      description: component.description ?? "",
      license: component.license,
      tags: component.tags,
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(
    component.preview_url || null,
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5 MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      form.setValue("preview_url", file)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    setIsLoading(true)

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

    if (formData.preview_url instanceof File) {
      const fileExtension = formData.preview_url.name.split(".").pop()
      const fileKey = `${component.user.id}/${component.component_slug}.${fileExtension}`
      const buffer = Buffer.from(await formData.preview_url.arrayBuffer())
      const base64Content = buffer.toString("base64")
      const previewImageUrl = await uploadToR2({
        file: {
          name: fileKey,
          type: formData.preview_url.type,
          encodedContent: base64Content,
        },
        fileKey,
        bucketName: "components-code",
        contentType: formData.preview_url.type,
      })
      updatedData.preview_url = previewImageUrl
    }

    await onUpdate(updatedData)
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose()
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
          previewImage={previewImage}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          isFormValid={() => true}
          internalDependencies={{}}
          componentName={component.name}
        />
      </DialogContent>
    </Dialog>
  )
}
