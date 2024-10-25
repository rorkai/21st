import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

export const createSupabaseClerkClientSSR = () => {
  const { getToken } = auth()
  if (!getToken) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    )
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken?.()

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
