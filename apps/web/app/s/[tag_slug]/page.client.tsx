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
  demos,
  tagName,
  initialTabCounts,
  initialSortBy,
  initialQuickFilter,
}: {
  demos: DemoWithComponent[]
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

  const { data: filteredDemos, isLoading } = useQuery<DemoWithComponent[]>({
    queryKey: ["tag-components", tagName, sortBy, quickFilter, searchQuery],
    queryFn: async () => {
      if (!quickFilter || !sortBy) {
        return []
      }

      const supabase = useClerkSupabaseClient()

      if (searchQuery) {
        const { data: searchResults, error } = await supabase.rpc(
          "search_demos",
          {
            search_query: searchQuery,
          },
        )

        if (error) throw new Error(error.message)

        return (searchResults || []).map((result) => ({
          id: result.id,
          name: result.name,
          demo_code: result.demo_code,
          preview_url: result.preview_url,
          video_url: result.video_url,
          compiled_css: result.compiled_css,
          demo_dependencies: result.demo_dependencies,
          demo_direct_registry_dependencies:
            result.demo_direct_registry_dependencies,
          pro_preview_image_url: result.pro_preview_image_url,
          created_at: result.created_at,
          updated_at: result.updated_at,
          component_id: result.component_id,
          component: result.component_data as Component,
          user: result.user_data as User,
          user_id: result.user_id,
          fts: result.fts || null,
        })) as DemoWithComponent[]
      }

      const { data: filteredData, error } = await supabase.rpc(
        "get_filtered_demos",
        {
          p_quick_filter: quickFilter,
          p_sort_by: sortBy,
          p_offset: 0,
          p_limit: 100,
        },
      )

      if (error) throw new Error(error.message)

      return (filteredData || []).map((result) => ({
        id: result.id,
        name: result.name,
        demo_code: result.demo_code,
        preview_url: result.preview_url,
        video_url: result.video_url,
        compiled_css: result.compiled_css,
        demo_dependencies: result.demo_dependencies,
        demo_direct_registry_dependencies:
          result.demo_direct_registry_dependencies,
        pro_preview_image_url: result.pro_preview_image_url,
        created_at: result.created_at,
        updated_at: result.updated_at,
        component_id: result.component_id,
        component: result.component_data as Component,
        user: result.user_data as User,
        user_id: (result.component_data as Component).user_id,
        fts: result.fts || null,
      })) as DemoWithComponent[]
    },
  })

  return (
    <div className="container mx-auto mt-20">
      <TagComponentsHeader
        filtersDisabled={!!searchQuery}
        demos={demos}
        currentSection={tagName}
      />
      <ComponentsList
        components={filteredDemos || demos}
        isLoading={isLoading}
      />
    </div>
  )
}
