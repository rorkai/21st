import { useQuery } from "@tanstack/react-query"
import { Tag } from "@/types/types"

async function validateTags(tags: Tag[]): Promise<Tag[]> {
  try {
    const response = await fetch("/api/validate-tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.validTags
  } catch (error) {
    console.error("Error validating tags:", error)
    // В случае ошибки возвращаем исходные теги
    return tags
  }
}

export function useValidTags(tags: Tag[] | undefined) {
  return useQuery<Tag[], Error>({
    queryKey: ["validateTags", tags],
    queryFn: () => validateTags(tags || []),
    enabled: !!tags && tags.length > 0,
  })
}
