"use client"

import { useAtom } from "jotai"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"

import { ComponentsList } from "@/components/ComponentsList"
import { quickFilterAtom, sortByAtom } from "@/components/ComponentsHeader"
import { searchQueryAtom } from "@/components/Header"
import { sortComponents, filterComponents } from "@/lib/filters.client"
import { Component, QuickFilterOption, SortOption, User } from "@/types/global"
import { TagComponentsHeader } from "@/components/TagComponentsHeader"
import { useLayoutEffect, useState } from "react"
import { DemoWithComponent } from "@/types/global"

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
  const [tabCounts, setTabCounts] = useState<
    Record<QuickFilterOption, number> | undefined
  >(undefined)

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

  const { data: filteredComponents, isLoading } = useQuery<DemoWithComponent[]>(
    {
      queryKey: ["tag-components", tagName, sortBy, quickFilter, searchQuery],
      queryFn: async () => {
        let filtered = components.map((component) => ({
          id: component.id,
          component_id: component.id,
          name: component.name,
          demo_code: component.demo_code,
          preview_url: component.preview_url,
          video_url: component.video_url,
          compiled_css: component.compiled_css,
          demo_dependencies: component.demo_dependencies,
          demo_direct_registry_dependencies:
            component.demo_direct_registry_dependencies,
          created_at: component.created_at,
          updated_at: component.updated_at,
          pro_preview_image_url: component.pro_preview_image_url,
          component: component,
          user: component.user,
          user_id: component.user_id,
        })) as DemoWithComponent[]

        if (searchQuery) {
          filtered = filtered.filter(
            (component) =>
              component.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              component.component.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()),
          )
        }

        if (!sortBy || !quickFilter) return filtered
        return sortComponents(
          filterComponents(
            filtered.map((d) => d.component as Component & { user: User }),
            quickFilter,
          ),
          sortBy,
        ).map((c) => ({
          ...filtered.find((d) => d.id === c.id)!,
        })) as DemoWithComponent[]
      },
      initialData: undefined,
    },
  )

  return (
    <div className="container mx-auto mt-20">
      <TagComponentsHeader
        filtersDisabled={!!searchQuery}
        components={components}
        currentSection={tagName}
      />
      <ComponentsList components={filteredComponents} isLoading={isLoading} />
    </div>
  )
}
