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

type SlugType = "component" | "demo"

const checkSlugUnique = async (
  supabase: SupabaseClient,
  slug: string,
  type: SlugType,
  userId: string,
  componentId?: number,
): Promise<boolean> => {
  if (type === "component") {
    const { data, error } = await supabase
      .from("components")
      .select("id")
      .eq("component_slug", slug)
      .eq("user_id", userId)

    if (error) {
      console.error("Error checking component slug uniqueness:", error)
      return false
    }

    return data?.length === 0
  } else {
    const { data, error } = await supabase
      .from("demos")
      .select("id")
      .eq("demo_slug", slug)
      .eq("component_id", componentId)

    if (error) {
      console.error("Error checking demo slug uniqueness:", error)
      return false
    }

    return data?.length === 0
  }
}

export const generateUniqueSlug = async (
  supabase: SupabaseClient,
  baseName: string,
  type: SlugType,
  userId: string,
  componentId?: number,
) => {
  let newSlug = makeSlugFromName(baseName)
  let isUnique = await checkSlugUnique(
    supabase,
    newSlug,
    type,
    userId,
    componentId,
  )
  let suffix = 1

  while (!isUnique) {
    newSlug = `${makeSlugFromName(baseName)}-${suffix}`
    isUnique = await checkSlugUnique(
      supabase,
      newSlug,
      type,
      userId,
      componentId,
    )
    suffix += 1
  }

  return newSlug
}

export const generateDemoSlug = async (
  supabase: SupabaseClient,
  name: string,
  componentId: number | null,
  userId: string,
): Promise<string> => {
  // For new components, just generate a slug from name
  if (componentId === null) {
    return makeSlugFromName(name) || "default"
  }

  const { data: existingDemos, error: demosError } = await supabase
    .from("demos")
    .select("id, demo_slug, component_id")
    .eq("component_id", componentId)

  if (demosError) {
    throw demosError
  }

  let baseSlug = makeSlugFromName(name) || "demo"
  let finalSlug = baseSlug
  let counter = 1

  // Keep trying new slugs until we find a unique one
  while (existingDemos?.some((demo) => demo.demo_slug === finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`
    counter++
  }

  return finalSlug
}

export const useIsCheckSlugAvailable = ({
  slug,
  type,
  userId,
  componentId,
  enabled = true,
}: {
  slug: string
  type: SlugType
  userId: string
  componentId?: number
  enabled?: boolean
}) => {
  const client = useClerkSupabaseClient()

  const {
    data: isAvailable,
    isFetching: isChecking,
    error: error,
  } = useQuery({
    queryKey: ["slugCheck", slug, type, userId, componentId],
    queryFn: async () => {
      if (!isValidSlug(slug)) {
        throw new Error(
          "Slug should contain only lowercase letters, numbers and dashes. It should end with a letter or a number",
        )
      }
      return await checkSlugUnique(client, slug, type, userId, componentId)
    },
    enabled:
      !!slug &&
      !!userId &&
      (type === "demo" ? !!componentId : true) &&
      !!enabled,
  })

  return {
    isAvailable,
    isChecking,
    error,
  }
}
