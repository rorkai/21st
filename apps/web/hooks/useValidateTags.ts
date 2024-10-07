import { useQuery } from "@tanstack/react-query"
import { Tag } from "@/types/types"

const validateTags = async (tags: Partial<Tag>[]): Promise<Tag[]> => {
  const response = await fetch("/api/validate-tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tags),
  })
  if (!response.ok) throw new Error("Failed to validate tags")
  return response.json()
}

export const useValidTags = (tags: Partial<Tag>[]) => {
  return useQuery({
    queryKey: ["validateTags", tags],
    queryFn: () => validateTags(tags),
    enabled: tags.length > 0,
  })
}
