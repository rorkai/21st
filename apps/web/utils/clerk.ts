"use client"

import { useSession } from "@clerk/nextjs"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { atom, useAtom } from "jotai"
import { useEffect } from "react"

export const createSupabaseClerkClient = (getToken?: () => Promise<string | null>) => {
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

const supabaseClientAtom = atom<SupabaseClient>(
  createSupabaseClerkClient(),
)

export function useClerkSupabaseClient(): SupabaseClient {
  const { session } = useSession()
  const [supabaseClient, setSupabaseClient] = useAtom(supabaseClientAtom)

  useEffect(() => {
    if (session) {
      setSupabaseClient(createSupabaseClerkClient(() => session.getToken({ template: "supabase" })))
    }
  }, [session])

  return supabaseClient
}
