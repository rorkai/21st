/* eslint-disable no-unused-vars */
import { useClerkSupabaseClient } from "@/utils/clerk"
import { FormData } from "./utils"
import { UseFormReturn } from "react-hook-form"

export const uploadToStorage = async (
  client: ReturnType<typeof useClerkSupabaseClient>,
  fileName: string,
  content: string,
) => {
  const { error } = await client.storage
    .from("components")
    .upload(fileName, content, {
      contentType: "text/plain",
      upsert: true,
    })

  if (error) throw error

  const { data: publicUrlData } = client.storage
    .from("components")
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}

export const uploadPreviewImage = async (
  client: ReturnType<typeof useClerkSupabaseClient>,
  file: File,
  componentSlug: string,
): Promise<string> => {
  const fileExtension = file.name.split(".").pop()
  const fileName = `${componentSlug}-preview-${Date.now()}.${fileExtension}`
  const { error } = await client.storage
    .from("components")
    .upload(fileName, file, { upsert: true })

  if (error) throw error

  const { data } = client.storage.from("components").getPublicUrl(fileName)

  return data.publicUrl
}

export const handleFileChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setPreviewImage: (image: string) => void,
  form: UseFormReturn<FormData>,
) => {
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
