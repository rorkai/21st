import { useClerkSupabaseClient } from "@/utils/clerk"

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

// ... (добавьте сюда другие вспомогательные функции из ComponentForm.tsx)
