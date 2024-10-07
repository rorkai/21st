import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { useSession } from "@clerk/nextjs"

let supabaseClient: SupabaseClient | null = null

export function useClerkSupabaseClient() {
  const { session } = useSession()

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await session?.getToken({
              template: "supabase",
            })

            const headers = new Headers(options?.headers)
            headers.set("Authorization", `Bearer ${clerkToken}`)

            return fetch(url, {
              ...options,
              headers,
            })
          },
        },
      },
    )
  }

  return supabaseClient
}
