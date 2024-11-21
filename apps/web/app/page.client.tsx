"use client"

import React from "react"
import { ComponentCard } from "@/components/ComponentCard"
import { Component, User } from "@/types/global"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { Skeleton } from "@/components/ui/skeleton"
import { useAtom } from "jotai"
import { searchQueryAtom } from "@/components/Header"

export function HomePageClient({
  initialComponents,
}: {
  initialComponents: (Component & { user: User })[]
}) {
  const [searchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()

  const { data: components } = useQuery<(Component & { user: User })[]>({
    queryKey: ["components", searchQuery],
    queryFn: async () => {
      if (!searchQuery) {
        const { data, error } = await supabase
          .from("components")
          .select("*, user:users!user_id (*)")
          .limit(1000)
          .eq("is_public", true)
          .order('created_at', { ascending: false })
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

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
      {components?.map((component) => (
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
  )
}
