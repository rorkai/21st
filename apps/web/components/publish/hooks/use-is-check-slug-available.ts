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
  componentId: number,
  userId: string,
): Promise<string> => {
  console.log("Generating demo slug for:", { name, componentId, userId })

  // Проверяем существующие демо для этого компонента с полным логированием
  const { data: existingDemos, error: demosError } = await supabase
    .from("demos")
    .select("id, demo_slug, component_id")
    .eq("component_id", componentId)
    .then((result) => {
      console.log("Supabase query result:", {
        data: result.data,
        error: result.error,
        status: result.status,
        statusText: result.statusText,
        count: result.count
      })
      return result
    })

  if (demosError) {
    console.error("Error fetching existing demos:", demosError)
    throw demosError
  }

  // Дополнительная проверка конкретного слага
  const slugToCheck = makeSlugFromName(name)
  const { data: existingWithSlug, error: slugCheckError } = await supabase
    .from("demos")
    .select("id, demo_slug, component_id")
    .eq("component_id", componentId)
    .eq("demo_slug", slugToCheck)
    .then((result) => {
      console.log("Slug check result:", {
        slug: slugToCheck,
        data: result.data,
        error: result.error,
        status: result.status,
        statusText: result.statusText,
        count: result.count
      })
      return result
    })

  console.log("Existing demos:", existingDemos)
  console.log("Checking specific slug:", { 
    slug: slugToCheck, 
    exists: existingWithSlug?.length && existingWithSlug.length > 0 
  })

  // Проверяем доступность 'default'
  const hasDefaultDemo = existingDemos?.some(demo => demo.demo_slug === 'default')
  
  if (!hasDefaultDemo) {
    console.log("Using 'default' slug as it's available")
    return "default"
  }

  // Если 'default' занят, генерируем уникальный slug из имени
  let baseSlug = makeSlugFromName(name)
  let finalSlug = baseSlug
  let counter = 1

  while (true) {
    const slugExists = existingDemos?.some(demo => demo.demo_slug === finalSlug)
    
    console.log("Checking slug:", finalSlug, "exists:", slugExists)
    
    if (!slugExists) {
      console.log("Found available slug:", finalSlug)
      return finalSlug
    }

    finalSlug = `${baseSlug}-${counter}`
    counter++
  }
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
