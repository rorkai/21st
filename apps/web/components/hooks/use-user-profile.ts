import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"

export function useUserProfile() {
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
      return data
    },
    enabled: !!clerkUser?.id,
  })

  return {
    user: userProfile,
    isLoading,
    clerkUser,
  }
}
