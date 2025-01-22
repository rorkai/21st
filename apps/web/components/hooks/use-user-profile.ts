import { useUser } from "@clerk/nextjs"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type ClerkUser = ReturnType<typeof useUser>["user"]

interface UserProfile {
  id: string
  username: string | null
  name: string | null
  image_url: string | null
  display_name: string | null
  display_username: string | null
  display_image_url: string | null
  bio: string | null
  website_url: string | null
  github_url: string | null
  twitter_url: string | null
  created_at: string
  manually_added: boolean
}

export function useUserProfile(): {
  user: UserProfile | null
  isLoading: boolean
  clerkUser: ClerkUser
  client: SupabaseClient<Database>
} {
  const { user: clerkUser } = useUser()
  const client = useClerkSupabaseClient()

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["user", clerkUser?.id, "profile"],
    queryFn: async () => {
      if (!clerkUser?.id) return null
      const { data } = await client
        .from("users")
        .select(
          `
          id,
          username,
          name,
          image_url,
          display_name,
          display_username,
          display_image_url,
          bio,
          website_url,
          github_url,
          twitter_url,
          created_at,
          manually_added
        `,
        )
        .eq("id", clerkUser.id)
        .single()
      return data as UserProfile | null
    },
    enabled: !!clerkUser?.id,
  })

  return {
    user: userProfile ?? null,
    isLoading,
    clerkUser,
    client,
  }
}
