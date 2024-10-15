"use client"

import React from "react"
import { ComponentCard } from "@/components/ComponentCard"
import { Component, User } from "@/types/types"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { Skeleton } from "@/components/ui/skeleton"
import { useAtom } from "jotai"
import { searchQueryAtom } from "@/components/Header"

export function HomePageClient({
  initialComponents,
}: {
  initialComponents: Component[]
}) {
  const [searchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()

  const { data: components } = useQuery({
    queryKey: ["components", searchQuery],
    queryFn: async () => {
      if (!searchQuery) {
        const { data, error } = await supabase
          .from("components")
          .select("*, user:users!user_id (*)")
          .limit(1000)
          .eq("is_public", true)
        if (error) {
          throw new Error(error.message || `HTTP error: ${status}`)
        }
        return data
      }
      const { data: components, error } = await supabase.rpc(
        "search_components",
        {
          search_query: searchQuery,
        },
      )
      if (error) {
        throw new Error(error.message || `HTTP error: ${status}`)
      }
      return components.map((component: Component & { user_data: User }) => ({
        ...component,
        user: component.user_data as User,
      }))
    },
    initialData: initialComponents,
    refetchOnWindowFocus: false,
    retry: false,
  })

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
        {components?.map((component: Component & { user: User }) => (
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
  )
}
