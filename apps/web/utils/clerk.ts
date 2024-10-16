"use client"

import { Database } from "@/types/supabase"
import { useSession } from "@clerk/nextjs"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { atom, useAtom } from "jotai"
import { useEffect } from "react"

export const createSupabaseClerkClient = (
  getToken?: () => Promise<string | null>,
) => {
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

const supabaseClerkClientAtom = atom<SupabaseClient<Database> | null>(null)
const defaultSupabaseClient = createSupabaseClerkClient()

export function useClerkSupabaseClient(): SupabaseClient<Database> {
  const { session } = useSession()
  const [clerkClient, setClerkClient] = useAtom(supabaseClerkClientAtom)

  useEffect(() => {
    if (session && !clerkClient) {
      setClerkClient(
        createSupabaseClerkClient(() =>
          session.getToken({ template: "supabase" }),
        ),
      )
    }
  }, [session])

  return clerkClient ?? defaultSupabaseClient
}
