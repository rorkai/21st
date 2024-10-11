import { Component, Tag, User } from "@/types/types"
import { useQuery } from "@tanstack/react-query"
import { generateSlug } from "@/components/ComponentForm/useIsCheckSlugAvailable"
import { SupabaseClient } from "@supabase/supabase-js"
import { useClerkSupabaseClient } from "./clerk"

const componentFields = `
  *,
  user:users!user_id (*)
`

export async function getComponent(
  supabase: SupabaseClient | null,
  username: string,
  slug: string,
): Promise<{ data: Component | null; error: Error | null }> {
  if (!supabase) {
    console.error("Supabase client is null")
    return { data: null, error: new Error("Supabase client is null") }
  }

  const { data, error } = await supabase
    .from("components")
    .select(
      `
      ${componentFields},
      tags:component_tags(tags(name, slug))
    `,
    )
    .eq("component_slug", slug)
    .eq("user.username", username)
    .single()

  if (error) {
    console.error("Error fetching component:", error)
    return { data: null, error: new Error(error.message) }
  }

  if (data && data.tags) {
    data.tags = data.tags.map((tag: any) => tag.tags)
  }

  return { data, error }
}

export async function getUserData(
  supabase: SupabaseClient,
  username: string,
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single()

    if (error) {
      console.error("Error fetching user data:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserData:", error)
    return null
  }
}

export function useUserData(username: string) {
  const supabase = useClerkSupabaseClient()
  return useQuery<User | null, Error>({
    queryKey: ["user", username],
    queryFn: () => getUserData(supabase, username),
  })
}

export async function getUserComponents(
  supabase: SupabaseClient,
  userId: string,
): Promise<Component[] | null> {
  const { data, error } = await supabase
    .from("components")
    .select(componentFields)
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user components:", error)
    return null
  }

  return data
}

export function useUserComponents(userId: string) {
  const supabase = useClerkSupabaseClient()
  return useQuery<Component[] | null, Error>({
    queryKey: ["userComponents", userId],
    queryFn: () => getUserComponents(supabase, userId),
  })
}

export async function getComponents(
  supabase: SupabaseClient,
): Promise<Component[]> {
  const { data, error } = await supabase
    .from("components")
    .select(componentFields)
    .limit(1000)

  if (error) {
    return []
  }

  return data || []
}

export function useComponents() {
  const supabase = useClerkSupabaseClient()
  return useQuery<Component[], Error>({
    queryKey: ["components"],
    queryFn: () => getComponents(supabase),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export async function getComponentTags(
  componentId: string,
): Promise<Tag[] | null> {
  const supabase = useClerkSupabaseClient()
  const { data, error } = await supabase
    .from("component_tags")
    .select("tags(name, slug)")
    .eq("component_id", componentId)

  if (error) {
    console.error("Error fetching component tags:", error)
    return null
  }

  return data.map((item: any) => item.tags)
}

export function useComponentTags(componentId: string) {
  return useQuery<Tag[] | null, Error>({
    queryKey: ["componentTags", componentId],
    queryFn: () => getComponentTags(componentId),
  })
}

export async function addComponent(
  supabase: SupabaseClient,
  componentData: any,
) {
  const { data, error } = await supabase
    .from("components")
    .insert(componentData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addTagsToComponent(
  supabase: SupabaseClient,
  componentId: number,
  tags: Tag[],
) {
  for (const tag of tags) {
    let tagId: number

    if (tag.id) {
      tagId = tag.id
    } else {
      const capitalizedName =
        tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
      const slug = generateSlug(tag.name)
      const { data: existingTag, error: selectError } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .single()

      if (existingTag) {
        tagId = existingTag.id
      } else {
        const { data: newTag, error: insertError } = await supabase
          .from("tags")
          .insert({ name: capitalizedName, slug })
          .single()

        if (insertError) {
          console.error("Error inserting tag:", insertError)
          continue
        }
        if (newTag && typeof newTag === "object" && "id" in newTag) {
          tagId = (newTag as { id: number }).id
        } else {
          console.error("New tag was not created or does not have an id")
          continue
        }
      }
    }

    const { error: linkError } = await supabase
      .from("component_tags")
      .insert({ component_id: componentId, tag_id: tagId })

    if (linkError) {
      console.error("Error linking tag to component:", linkError)
    }
  }
}

export function useAvailableTags() {
  async function getAvailableTags(supabase: SupabaseClient): Promise<Tag[]> {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name")

    if (error) {
      console.error("Error loading tags:", error)
      return []
    }

    return data || []
  }

  const supabase = useClerkSupabaseClient()

  return useQuery<Tag[], Error>({
    queryKey: ["availableTags"],
    queryFn: () => getAvailableTags(supabase),
  })
}

export function useComponentOwnerUsername(slug: string) {
  const supabase = useClerkSupabaseClient()
  return useQuery<string | null, Error>({
    queryKey: ["componentOwner", slug],
    queryFn: async () => {
      const { data: component, error: componentError } = await supabase
        .from("components")
        .select("user_id")
        .eq("component_slug", slug)
        .single()

      if (componentError || !component) {
        console.error("Error fetching component:", componentError)
        return null
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("id", component.user_id)
        .single()

      if (userError || !user) {
        console.error("Error fetching user:", userError)
        return null
      }

      return user.username
    },
  })
}

export async function fetchDependencyComponents(
  supabase: SupabaseClient,
  dependencySlugs: string[],
): Promise<Component[]> {
  const components = await Promise.all(
    dependencySlugs.map(async (slug) => {
      try {
        const { data, error } = await supabase
          .from("components")
          .select(componentFields)
          .eq("component_slug", slug)
          .single()

        if (error) {
          console.error("Error fetching dependency component:", error)
          return null
        }

        return data
      } catch (error) {
        console.error("Error fetching dependency component:", error)
        return null
      }
    }),
  )
  return components.filter((c): c is Component => c !== null)
}

export function useDependencyComponents(
  componentDependencies: Record<string, string>,
) {
  const supabase = useClerkSupabaseClient()
  const dependencySlugs = Object.values(componentDependencies)

  return useQuery<Component[], Error>({
    queryKey: ["dependencyComponents", dependencySlugs],
    queryFn: () => fetchDependencyComponents(supabase, dependencySlugs),
    enabled: dependencySlugs.length > 0,
    refetchOnMount: true,
    staleTime: 0,
  })
}
