import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { SupabaseClient } from "@supabase/supabase-js"

export const makeSlugFromName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
}

const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

const checkSlugUnique = async (
  supabase: SupabaseClient,
  slug: string,
  userId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("components")
    .select("id")
    .eq("component_slug", slug)
    .eq("user_id", userId)

  if (error) {
    console.error("Error checking slug uniqueness:", error)
    return false
  }

  return data?.length === 0
}

export const generateUniqueSlug = async (
  supabase: SupabaseClient,
  baseName: string,
  userId: string,
) => {
  let newSlug = makeSlugFromName(baseName)
  let isUnique = await checkSlugUnique(supabase, newSlug, userId)
  let suffix = 1

  while (!isUnique) {
    newSlug = `${makeSlugFromName(baseName)}-${suffix}`
    isUnique = await checkSlugUnique(supabase, newSlug, userId)
    suffix += 1
  }

  return newSlug
}

export const useIsCheckSlugAvailable = ({
  slug,
  userId,
  enabled = true,
}: {
  slug: string
  userId: string
  enabled?: boolean
}) => {
  const client = useClerkSupabaseClient()

  const {
    data: isAvailable,
    isFetching: isChecking,
    error: error,
  } = useQuery({
    queryKey: ["slugCheck", slug, userId],
    queryFn: async () => {
      if (!isValidSlug(slug)) {
        throw new Error(
          "Slug should contain only lowercase letters, numbers and dashes. It should end with a letter or a number",
        )
      }
      return await checkSlugUnique(client, slug, userId)
    },
    enabled: !!slug && !!userId && !!enabled,
  })

  return {
    isAvailable,
    isChecking,
    error,
  }
}
