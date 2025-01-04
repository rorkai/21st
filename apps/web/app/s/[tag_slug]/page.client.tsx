"use client"

import { useAtom } from "jotai"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"

import { ComponentsList } from "@/components/ComponentsList"
import {
  ComponentsHeader,
  quickFilterAtom,
  sortByAtom,
} from "@/components/ComponentsHeader"
import { searchQueryAtom } from "@/components/Header"
import { sortComponents, filterComponents } from "@/lib/filters.client"
import { Component, User } from "@/types/global"
import { TagComponentsHeader } from "@/components/TagComponentsHeader"

export function TagPageContent({
  components,
  tagName,
}: {
  components: (Component & { user: User })[]
  tagName: string
}) {
  const [sortBy] = useAtom(sortByAtom)
  const [quickFilter] = useAtom(quickFilterAtom)
  const [searchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()

  const { data: filteredComponents, isLoading } = useQuery<
    (Component & { user: User })[]
  >({
    queryKey: ["tag-components", tagName, sortBy, quickFilter, searchQuery],
    queryFn: async () => {
      let filtered = components

      if (searchQuery) {
        filtered = filtered.filter(
          (component) =>
            component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            component.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()),
        )
      }

      if (!sortBy || !quickFilter) return filtered
      return sortComponents(filterComponents(filtered, quickFilter), sortBy)
    },
    initialData: undefined,
  })

  return (
    <>
      <div className="flex flex-col">
        <TagComponentsHeader
          filtersDisabled={!!searchQuery}
          components={components}
          currentSection={`${tagName} components`}
        />
      </div>
      <ComponentsList
        components={filteredComponents}
        isLoading={isLoading}
        className="mt-6"
      />
    </>
  )
}
