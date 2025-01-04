"use client"

import { useAtom, useAtomValue } from "jotai"
import { ComponentsList } from "@/components/ComponentsList"
import { searchQueryAtom } from "@/components/Header"
import { userComponentsTabAtom } from "@/components/UserComponentsHeader"
import { Component, User } from "@/types/global"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"

interface UserComponentsListProps {
  publishedComponents?: (Component & { user: User })[]
  huntedComponents?: (Component & { user: User })[]
}

export function UserComponentsList({
  publishedComponents = [],
  huntedComponents = [],
}: UserComponentsListProps) {
  const activeTab = useAtomValue(userComponentsTabAtom)
  const [searchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()

  const { data: components, isLoading } = useQuery<
    (Component & { user: User })[]
  >({
    queryKey: ["user-components", activeTab, searchQuery],
    queryFn: async () => {
      const baseComponents =
        activeTab === "published" ? publishedComponents : huntedComponents
      if (!searchQuery) return baseComponents

      const query = searchQuery.toLowerCase()
      return baseComponents.filter((component) => {
        return (
          component.name.toLowerCase().includes(query) ||
          component.description?.toLowerCase().includes(query) ||
          component.user.name?.toLowerCase().includes(query) ||
          (component.user.username &&
            component.user.username.toLowerCase().includes(query))
        )
      })
    },
    initialData: undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  return <ComponentsList components={components} isLoading={isLoading} />
}
