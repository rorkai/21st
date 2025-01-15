import {
  Component,
  Demo,
  DemoWithComponent,
  QuickFilterOption,
  SortOption,
  Tag,
  User,
} from "@/types/global"
import {
  UseMutationResult,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query"
import { makeSlugFromName } from "@/components/publish/hooks/use-is-check-slug-available"
import { SupabaseClient } from "@supabase/supabase-js"
import { useClerkSupabaseClient } from "./clerk"
import { Database } from "@/types/supabase"

export const componentReadableDbFields = `
  *,
  user:users!user_id (*)
`

export const demoReadableDbFields = `
  *,
  component:components!component_id (*),
  user:components!component_id(users!user_id(*))
`

export async function getComponent(
  supabase: SupabaseClient<Database>,
  username: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("components")
    .select(
      `
      ${componentReadableDbFields},
      tags:component_tags(tags(name, slug))
    `,
    )
    .eq("component_slug", slug)
    .eq("user.username", username)
    .not("user", "is", null)
    .eq("is_public", true)
    .order("downloads_count", { ascending: false })
    .returns<(Component & { user: User } & { tags: Tag[] })[]>()
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
  supabase: SupabaseClient<Database>,
  username: string,
): Promise<{ data: User | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single()

    if (error) {
      console.error("Error fetching user data:", error)
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getUserData:", error)
    return { data: null, error }
  }
}

export async function getUserComponents(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("components")
    .select(componentReadableDbFields)
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("downloads_count", { ascending: false })
    .returns<(Component & { user: User })[]>()

  if (error) {
    console.error("Error fetching user components:", error)
    return null
  }

  return data
}

export async function getComponents(
  supabase: SupabaseClient<Database>,
  tagSlug?: string,
) {
  let query = supabase
    .from("components")
    .select(
      `
    *,
    user:users!user_id (*),
    component_tags!inner (
      tags!inner (
        slug
      )
    )
  `,
    )
    .eq("is_public", true)
    .order("downloads_count", { ascending: false })

  if (tagSlug) {
    query = query.eq("component_tags.tags.slug", tagSlug)
  }

  const { data, error } = await query
    .limit(1000)
    .returns<(Component & { user: User } & { tags: Tag[] })[]>()

  if (error) {
    throw new Error(error.message)
  }
  return data as (Component & { user: User } & { tags: Tag[] })[]
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

export async function likeComponent(
  supabase: SupabaseClient<Database>,
  userId: string,
  componentId: number,
) {
  const { error } = await supabase.from("component_likes").insert({
    user_id: userId,
    component_id: componentId,
  })

  if (error) {
    console.error("Error liking component:", error)
    throw error
  }
}

export async function unlikeComponent(
  supabase: SupabaseClient<Database>,
  userId: string,
  componentId: number,
) {
  const { error } = await supabase
    .from("component_likes")
    .delete()
    .eq("user_id", userId)
    .eq("component_id", componentId)

  if (error) {
    console.error("Error unliking component:", error)
    throw error
  }
}

export function useLikeMutation(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): UseMutationResult<void, Error, { componentId: number; liked: boolean }> {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { componentId: number; liked: boolean }>({
    mutationFn: async ({
      componentId,
      liked,
    }: {
      componentId: number
      liked: boolean
    }) => {
      if (!userId) {
        throw new Error("User is not logged in")
      }
      if (liked) {
        await unlikeComponent(supabase, userId, componentId)
      } else {
        await likeComponent(supabase, userId, componentId)
      }
    },
    onSuccess: (_, { componentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["hasUserLikedComponent", componentId, userId],
      })
      queryClient.invalidateQueries({
        queryKey: ["component", componentId],
      })
      queryClient.invalidateQueries({
        queryKey: ["components"],
      })
    },
  })
}

export async function addTagsToComponent(
  supabase: SupabaseClient<Database>,
  demoId: number,
  tags: Tag[],
) {
  for (const tag of tags) {
    let tagId: number

    if (tag.id) {
      tagId = tag.id
    } else {
      const capitalizedName =
        tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
      const slug = makeSlugFromName(tag.name)
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
          .select()
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
      .from("demo_tags")
      .insert({ demo_id: demoId, tag_id: tagId })

    if (linkError) {
      console.error("Error linking tag to demo:", linkError)
    }
  }
}

export function useAvailableTags() {
  async function getAvailableTags(
    supabase: SupabaseClient<Database>,
  ): Promise<Tag[]> {
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

export function useComponentOwnerUsername(
  supabase: SupabaseClient<Database>,
  slug: string,
) {
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

export async function updateComponentWithTags(
  supabase: SupabaseClient,
  componentId: number,
  updatedData: Partial<Component & { tags?: Tag[] }>,
) {
  const { name, description, license, preview_url, website_url, tags } =
    updatedData

  const tagsJson = tags
    ? tags.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
      }))
    : null

  const { data, error } = await supabase.rpc("update_component_with_tags", {
    p_component_id: componentId,
    p_name: name !== undefined ? name : null,
    p_description: description !== undefined ? description : null,
    p_license: license !== undefined ? license : null,
    p_preview_url: preview_url !== undefined ? preview_url : null,
    p_website_url: website_url !== undefined ? website_url : null,
    p_tags: tagsJson,
  })

  if (error) {
    console.error("Error updating component with tags:", error)
    throw error
  }

  return data
}

export function useUpdateComponentWithTags(
  supabase: SupabaseClient,
): UseMutationResult<
  void,
  Error,
  { componentId: number; updatedData: Partial<Component & { tags?: Tag[] }> }
> {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { componentId: number; updatedData: Partial<Component & { tags?: Tag[] }> }
  >({
    mutationFn: async ({ componentId, updatedData }) => {
      await updateComponentWithTags(supabase, componentId, updatedData)
    },
    onSuccess: (_data, { componentId }) => {
      queryClient.invalidateQueries({ queryKey: ["component", componentId] })
      queryClient.invalidateQueries({ queryKey: ["components"] })
    },
  })
}

export async function getHunterUser(
  supabase: SupabaseClient<Database>,
  hunterUsername: string | null,
): Promise<User | null> {
  if (!hunterUsername) return null

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", hunterUsername)
    .single()

  if (error) {
    console.error("Error fetching hunter user:", error)
    return null
  }

  return data
}

export function useHunterUser(hunterUsername: string | null) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["hunterUser", hunterUsername],
    queryFn: () => getHunterUser(supabase, hunterUsername),
    enabled: !!hunterUsername,
    staleTime: Infinity,
  })
}

export async function getHuntedComponents(
  supabase: SupabaseClient<Database>,
  hunterUsername: string,
) {
  const { data, error } = await supabase
    .from("components")
    .select(componentReadableDbFields)
    .eq("hunter_username", hunterUsername)
    .eq("is_public", true)
    .order("downloads_count", { ascending: false })
    .returns<(Component & { user: User })[]>()

  if (error) {
    console.error("Error fetching hunted components:", error)
    return null
  }

  return data
}

export function useHuntedComponents(username: string) {
  const supabase = useClerkSupabaseClient()
  return useQuery({
    queryKey: ["huntedComponents", username],
    queryFn: () => getHuntedComponents(supabase, username),
    staleTime: Infinity,
  })
}

export async function getFilteredDemos(
  supabase: SupabaseClient<Database>,
  quickFilter: QuickFilterOption,
  sortBy: SortOption,
  offset: number,
  limit: number = 24,
) {
  const { data, error } = await supabase
    .rpc("get_filtered_demos", {
      p_quick_filter: quickFilter,
      p_sort_by: sortBy,
      p_offset: offset,
      p_limit: limit,
    })
    .returns<DemoWithComponent[]>()

  if (error) {
    console.error("Error fetching demos:", error)
    throw error
  }

  return data
}

export async function getComponentWithDemo(
  supabase: SupabaseClient<Database>,
  username: string,
  componentSlug: string,
  demoSlug: string = "default",
): Promise<{
  data: {
    component: Component & { user: User }
    demo: Demo & { tags: Tag[] }
  } | null
  error: Error | null
}> {
  try {
    const { data: component, error: componentError } = await supabase
      .from("components")
      .select(
        `
        *,
        user:users!components_user_id_fkey(*)
      `,
      )
      .eq("component_slug", componentSlug)
      .eq("users.username", username)
      .single()

    if (componentError) throw componentError

    const { data: demo, error: demoError } = await supabase
      .from("demos")
      .select(
        `
        *,
        tags:demo_tags(tags(*))
      `,
      )
      .eq("component_id", component.id)
      .eq("demo_slug", demoSlug)
      .single()

    if (demoError) throw demoError

    const formattedTags = demo.tags.map((tag: any) => tag.tags)

    return {
      data: {
        component: component as Component & { user: User },
        demo: { ...demo, tags: formattedTags } as Demo & { tags: Tag[] },
      },
      error: null,
    }
  } catch (error) {
    console.error("Error in getComponentWithDemo:", error)
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Unknown error occurred"),
    }
  }
}

export async function getDemos(
  supabase: SupabaseClient<Database>,
  tagSlug?: string,
) {
  const { data, error } = await supabase.rpc("get_demos", {
    p_tag_slug: tagSlug || undefined,
  })

  if (error) {
    console.error("Error fetching demos:", error)
    return []
  }

  return (data || []).map((result) => ({
    ...result,
    component: {
      ...(result.component_data as Component),
      user: result.user_data,
    } as Component & { user: User },
  })) as DemoWithComponent[]
}

export async function getDemosCounts(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("get_demos_counts")

  if (error) {
    console.error("Error fetching demos counts:", error)
    return null
  }

  return data
}

export async function getUserDemos(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase.rpc("get_user_demos", {
    p_user_id: userId,
  })

  if (error) {
    console.error("Error fetching user demos:", error)
    return []
  }

  return (data || []).map((result) => ({
    id: result.id,
    name: result.name,
    demo_code: result.demo_code,
    preview_url: result.preview_url,
    video_url: result.video_url,
    compiled_css: result.compiled_css,
    demo_dependencies: result.demo_dependencies,
    demo_direct_registry_dependencies: result.demo_direct_registry_dependencies,
    pro_preview_image_url: result.pro_preview_image_url,
    created_at: result.created_at,
    updated_at: result.updated_at,
    component_id: result.component_id,
    component: {
      ...(result.component_data as Component),
      user: result.user_data,
    } as Component & { user: User },
    user_id: result.user_id,
    fts: result.fts || null,
    demo_slug: result.demo_slug,
  })) as DemoWithComponent[]
}
