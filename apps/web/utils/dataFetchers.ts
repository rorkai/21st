import { supabase } from "@/utils/supabase"
import { Component, Tag, User } from "@/types/types"
import { useQuery } from "@tanstack/react-query"
import { generateSlug } from "@/hooks/useComponentSlug"

const userFields = `
  id,
  username,
  image_url,
  name,
  email,
  created_at,
  updated_at
`

const componentFields = `
  *,
  user:users!user_id (${userFields})
`

export async function getComponent(
  username: string,
  slug: string,
): Promise<Component | null> {
  console.log("getComponent called with username:", username, "and slug:", slug)
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
    return null
  }

  if (data && data.tags) {
    data.tags = data.tags.map((tag: any) => tag.tags)
  }

  return data
}

export function useComponent(username: string, slug: string) {
  return useQuery<Component | null, Error>({
    queryKey: ["component", username, slug],
    queryFn: () => getComponent(username, slug),
  })
}

export async function getUserData(username: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(userFields)
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
  return useQuery<User | null, Error>({
    queryKey: ["user", username],
    queryFn: () => getUserData(username),
  })
}

export async function getUserComponents(
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
  return useQuery<Component[] | null, Error>({
    queryKey: ["userComponents", userId],
    queryFn: () => getUserComponents(userId),
  })
}

export async function getComponents(): Promise<Component[]> {
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
  return useQuery<Component[], Error>({
    queryKey: ["components"],
    queryFn: getComponents,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export async function getComponentTags(
  componentId: string,
): Promise<Tag[] | null> {
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

export async function addComponent(componentData: any) {
  const { data, error } = await supabase
    .from("components")
    .insert(componentData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addTagsToComponent(componentId: number, tags: Tag[]) {
  for (const tag of tags) {
    let tagId: number

    if (tag.id) {
      tagId = tag.id
    } else {
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
          .insert({ name: tag.name, slug })
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

export async function getAvailableTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from("tags").select("*").order("name")

  if (error) {
    console.error("Error loading tags:", error)
    return []
  }

  return data || []
}

export function useAvailableTags() {
  return useQuery<Tag[], Error>({
    queryKey: ["availableTags"],
    queryFn: getAvailableTags,
  })
}

export function useComponentOwnerUsername(slug: string) {
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
