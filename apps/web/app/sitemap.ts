import { MetadataRoute } from "next"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://21st.dev"

  const { data: components } = await supabaseWithAdminAccess
    .from("components")
    .select("component_slug, user:users!inner(username), updated_at")
    .eq("is_public", true)

  const { data: tags } = await supabaseWithAdminAccess
    .from("tags")
    .select("slug")

  const { data: users } = await supabaseWithAdminAccess
    .from("users")
    .select("username, updated_at")
  const componentUrls = (components || []).map(
    (component: {
      component_slug: string
      user: { username: string | null }
      updated_at: string
    }) => ({
      url: `${baseUrl}/${component.user.username}/${component.component_slug}`,
      lastModified: component.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  )

  const tagUrls = (tags || []).map((tag) => ({
    url: `${baseUrl}/s/${tag.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const userUrls = (users || []).map((user) => ({
    url: `${baseUrl}/${user.username}`,
    lastModified: user.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/publish`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...componentUrls,
    ...tagUrls,
    ...userUrls,
  ]
}
