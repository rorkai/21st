import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

export const createSupabaseClerkClientSSR = () => {
  const { getToken } = auth()
  console.log("createSupabaseClerkClientSSR called")
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log(process.env.NEXT_PUBLIC_SUPABASE_KEY)
  console.log(getToken)
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

          console.log("clerkToken", clerkToken)

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
