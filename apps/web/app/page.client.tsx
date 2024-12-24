"use client"

import React, { useMemo, useEffect, useRef } from "react"
import { ComponentCard } from "@/components/ComponentCard"
import { Component, User } from "@/types/global"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Skeleton } from "@/components/ui/skeleton"
import { useAtom } from "jotai"
import { searchQueryAtom } from "@/components/Header"
import { ComponentsHeader, sortByAtom } from "@/components/ComponentsHeader"
import { AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { trackEvent } from "@/lib/amplitude"
import { motion } from "framer-motion"

export function HomePageClient({
  initialComponents,
  componentsTotalCount,
}: {
  initialComponents: (Component & { user: User })[]
  componentsTotalCount: number
}) {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()
  const [sortBy] = useAtom(sortByAtom)
  const lastTrackedQuery = useRef<string>("")

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery !== lastTrackedQuery.current) {
        trackEvent(AMPLITUDE_EVENTS.SEARCH_COMPONENTS, {
          query: searchQuery,
        })
        lastTrackedQuery.current = searchQuery
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const { data: components } = useQuery<(Component & { user: User })[]>({
    queryKey: ["components", searchQuery],
    queryFn: async () => {
      if (!searchQuery) {
        const { data, error } = await supabase
          .from("components")
          .select("*, user:users!user_id (*)")
          .limit(1000)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .returns<(Component & { user: User })[]>()

        if (error) {
          throw new Error(error.message || `HTTP error: ${status}`)
        }
        return data
      }
      const { data: searchResults, error } = await supabase.rpc(
        "search_components",
        {
          search_query: searchQuery,
        },
      )
      if (error) {
        throw new Error(error.message || `HTTP error: ${status}`)
      }
      return searchResults.map((result) => ({
        ...result,
        user: result.user_data as User,
        fts: undefined,
      })) as (Component & { user: User })[]
    },
    initialData: initialComponents,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const sortedComponents = useMemo(() => {
    if (!components) return undefined

    return [...components].sort((a, b) => {
      switch (sortBy) {
        case "installations":
          return (b.downloads_count || 0) - (a.downloads_count || 0)
        case "popular":
          return (b.likes_count || 0) - (a.likes_count || 0)
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        default:
          return 0
      }
    })
  }, [components, sortBy])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto mt-20"
    >
      <div className="flex flex-col">
        <ComponentsHeader totalCount={componentsTotalCount} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
          {sortedComponents?.map((component) => (
            <ComponentCard key={component.id} component={component} />
          ))}
          {components === undefined && (
            <>
              {[...Array(12)].map((_, index) => (
                <div key={index} className="overflow-hidden">
                  <div className="relative aspect-[4/3] mb-3">
                    <Skeleton className="w-full h-full rounded-lg" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center space-x-2 ml-auto">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
