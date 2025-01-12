"use client"

import { useAtom } from "jotai"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"

import { ComponentsList } from "@/components/ComponentsList"
import {
  quickFilterAtom,
  sortByAtom,
} from "@/components/ComponentsHeader"
import { searchQueryAtom } from "@/components/Header"
import { sortComponents, filterComponents } from "@/lib/filters.client"
import { Component, QuickFilterOption, SortOption, User } from "@/types/global"
import { TagComponentsHeader } from "@/components/TagComponentsHeader"
import { useLayoutEffect, useState } from "react"

export function TagPageContent({
  components,
  tagName,
  initialTabCounts,
  initialSortBy,
  initialQuickFilter,
}: {
  components: (Component & { user: User })[]
  tagName: string
  initialTabCounts: Record<QuickFilterOption, number>
  initialSortBy: SortOption
  initialQuickFilter: QuickFilterOption
}) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [quickFilter, setQuickFilter] = useAtom(quickFilterAtom)
  const [searchQuery] = useAtom(searchQueryAtom)
  const [tabCounts, setTabCounts] = useState<Record<QuickFilterOption, number> | undefined>(undefined)

  // Important: we don't need useEffect here
  // https://react.dev/learn/you-might-not-need-an-effect
  if (tabCounts === undefined) {
    setTabCounts(initialTabCounts)
  }

  // But we need useLayoutEffect here to avoid race conditions
  useLayoutEffect(() => {
    if (sortBy === undefined) {
      setSortBy(initialSortBy)
    }
    if (quickFilter === undefined) {
      setQuickFilter(initialQuickFilter)
    }
  }, [])

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
