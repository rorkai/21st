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
import { makeSlugFromName } from "@/components/features/publish/hooks/use-is-check-slug-available"
import { SupabaseClient } from "@supabase/supabase-js"
import { useClerkSupabaseClient } from "./clerk"
import { Database } from "@/types/supabase"
import { transformDemoResult } from "@/lib/utils/transformData"
import { replaceSpacesWithPlus } from "./utils"

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
      .or(`username.eq.${username},display_username.eq.${username}`)
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

export async function addTagsToDemo(
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
  const { data, error } = await supabase.rpc("get_hunted_components", {
    p_hunter_username: hunterUsername,
  })

  if (error) {
    console.error("Error fetching hunted components:", error)
    return null
  }

  return data.map((component) => ({
    ...component,
    user: component.user_data as User,
    view_count: component.view_count || 0,
  }))
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
    .rpc("get_filtered_demos_with_views", {
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
  slug: string,
  demo_slug: string,
) {
  // First get the user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .or(`username.eq.${username},display_username.eq.${username}`)
    .single()

  if (userError) {
    console.error("User error:", userError)
    return { data: null, error: new Error(userError.message) }
  }

  // Then get the component for this user
  const { data: component, error: componentError } = await supabase
    .from("components")
    .select(
      `
      *,
      user:users!components_user_id_fkey(*),
      mv_component_analytics!component_analytics_component_id_fkey(
        activity_type,
        count
      ),
      tags:component_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_slug", slug)
    .eq("user_id", user.id)
    .single()

  if (componentError) {
    console.error("Component error:", componentError)
    return { data: null, error: new Error(componentError.message) }
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("*")
    .eq("component_id", component.id)
    .maybeSingle()

  if (submissionError) {
    return { data: null, error: new Error(submissionError.message) }
  }

  const { data: demo, error: demoError } = await supabase
    .from("demos")
    .select(
      `
      *,
      demo_user:users!demos_user_id_fkey(*),
      tags:demo_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_id", component.id)
    .eq("demo_slug", demo_slug)
    .single()

  if (demoError) {
    if (demo_slug === "default") {
      return { data: null, error: new Error(demoError.message) }
    }
    return { data: null, error: null, shouldRedirectToDefault: true }
  }

  const formattedDemo = {
    ...(demo as any),
    user: demo.demo_user,
    tags: demo.tags ? demo.tags.map((tag: any) => tag.tags) : [],
    component: {
      ...component,
      user: component.user,
    },
  } as unknown as Demo & { user: User } & { tags: Tag[] } & {
    component: Component & { user: User }
  }

  delete (formattedDemo as any).demo_user

  const formattedComponent = {
    ...component,
    tags: component.tags ? component.tags.map((tag: any) => tag.tags) : [],
  } as unknown as Component & { user: User } & { tags: Tag[] }

  return {
    data: {
      component: formattedComponent,
      demo: formattedDemo,
      submission,
    },
    error: null,
  }
}

export async function getUserDemos(
  supabase: SupabaseClient<Database>,
  userId: string,
  loggedInUserId?: string,
) {
  const { data: filteredData, error } = await supabase.rpc(
    "get_filtered_demos_with_views",
    {
      p_quick_filter: "all",
      p_sort_by: "newest",
      p_offset: 0,
      p_limit: 1000,
      p_include_private: userId === loggedInUserId,
    },
  )

  if (error) {
    console.error("Error fetching user demos:", error)
    return null
  }

  // Transform all demos first
  const transformedDemos = (filteredData || []).map(transformDemoResult)

  // Then filter by user ID
  return transformedDemos.filter(
    (demo: DemoWithComponent) => demo.user_id === userId,
  )
}

export async function getComponentDemos(
  supabase: SupabaseClient<Database>,
  componentId: number,
) {
  const { data, error } = await supabase
    .from("demos")
    .select(
      `
      *,
      user:users!user_id (*),
      tags:demo_tags(
        tag:tag_id(*)
      ),
      component:components!component_id (
        *,
        user:users!user_id (*)
      )
    `,
    )
    .eq("component_id", componentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching component demos:", error)
    return { data: null, error }
  }

  // Transform the data to match DemoWithTags type
  const transformedData = data?.map((demo: any) => ({
    ...demo,
    tags: demo.tags.map((tagRelation: any) => tagRelation.tag),
    component: {
      ...demo.component,
      user: demo.component.user,
    },
  }))

  return { data: transformedData, error: null }
}

export async function getComponentWithDemoForOG(
  supabase: SupabaseClient<Database>,
  username: string,
  slug: string,
  demo_slug: string,
) {
  // First get the user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .or(`username.eq.${username},display_username.eq.${username}`)
    .single()

  if (userError) {
    console.error("User error:", userError)
    return { data: null, error: new Error(userError.message) }
  }

  // Then get the component for this user
  const { data: component, error: componentError } = await supabase
    .from("components")
    .select(
      `
      *,
      user:users!components_user_id_fkey(*),
      mv_component_analytics!component_analytics_component_id_fkey(
        activity_type,
        count
      ),
      tags:component_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_slug", slug)
    .eq("user_id", user.id)
    .single()

  if (componentError) {
    console.error("Component error:", componentError)
    return { data: null, error: new Error(componentError.message) }
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("*")
    .eq("component_id", component.id)
    .maybeSingle()

  if (submissionError) {
    return { data: null, error: new Error(submissionError.message) }
  }

  const { data: demo, error: demoError } = await supabase
    .from("demos")
    .select(
      `
      *,
      demo_user:users!demos_user_id_fkey(*),
      tags:demo_tags(
        tags:tags(*)
      )
    `,
    )
    .eq("component_id", component.id)
    .eq("demo_slug", demo_slug)
    .single()

  if (demoError) {
    if (demo_slug === "default") {
      return { data: null, error: new Error(demoError.message) }
    }
    return { data: null, error: null, shouldRedirectToDefault: true }
  }

  const formattedDemo = {
    ...(demo as any),
    user: demo.demo_user,
    tags: demo.tags ? demo.tags.map((tag: any) => tag.tags) : [],
    component: {
      ...component,
      user: component.user,
    },
  } as unknown as Demo & { user: User } & { tags: Tag[] } & {
    component: Component & { user: User }
  }

  delete (formattedDemo as any).demo_user

  const formattedComponent = {
    ...component,
    tags: component.tags ? component.tags.map((tag: any) => tag.tags) : [],
  } as unknown as Component & { user: User } & { tags: Tag[] }

  return {
    data: {
      component: formattedComponent,
      demo: formattedDemo,
      submission,
    },
    error: null,
  }
}
