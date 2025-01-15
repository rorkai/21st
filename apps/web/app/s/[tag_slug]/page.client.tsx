"use client"

import { useAtom } from "jotai"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ComponentsList } from "@/components/ComponentsList"
import { quickFilterAtom, sortByAtom } from "@/components/ComponentsHeader"
import { searchQueryAtom } from "@/components/Header"
import { filterComponents } from "@/lib/filters.client"
import {
  DemoWithComponent,
  QuickFilterOption,
  SortOption,
  User,
  Component,
} from "@/types/global"
import { TagComponentsHeader } from "@/components/TagComponentsHeader"
import { useLayoutEffect, useState, useEffect } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"

export function TagPageContent({
  initialComponents,
  tagName,
  tagSlug,
  initialTabCounts,
  initialSortBy,
  initialQuickFilter,
}: {
  initialComponents: DemoWithComponent[]
  tagName: string
  tagSlug: string
  initialTabCounts: Record<QuickFilterOption, number>
  initialSortBy: SortOption
  initialQuickFilter: QuickFilterOption
}) {
  console.log("Client: Starting TagPageContent render", {
    initialComponentsCount: initialComponents.length,
    tagName,
    tagSlug,
    initialTabCounts,
    initialSortBy,
    initialQuickFilter,
  })

  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [quickFilter, setQuickFilter] = useAtom(quickFilterAtom)
  const [searchQuery] = useAtom(searchQueryAtom)
  const [tabCounts, setTabCounts] = useState<
    Record<QuickFilterOption, number> | undefined
  >(initialTabCounts)
  const queryClient = useQueryClient()
  const supabase = useClerkSupabaseClient()

  useLayoutEffect(() => {
    if (sortBy === undefined) setSortBy(initialSortBy)
    if (quickFilter === undefined) setQuickFilter(initialQuickFilter)
  }, [])

  const { data, isLoading, isFetching } = useQuery<{
    data: DemoWithComponent[]
    total_count: number
  }>({
    queryKey: ["tag-filtered-demos", tagSlug, quickFilter, sortBy, searchQuery],
    queryFn: async () => {
      console.log("Client: Executing query function", {
        tagSlug,
        quickFilter,
        sortBy,
        searchQuery,
      })

      if (!quickFilter || !sortBy) {
        console.log("Client: Missing filter or sort")
        return { data: [], total_count: 0 }
      }

      const { data: filteredData, error } = await supabase.rpc(
        "get_filtered_demos",
        {
          p_quick_filter: quickFilter,
          p_sort_by: sortBy,
          p_offset: 0,
          p_limit: 40,
          p_tag_slug: tagSlug,
        },
      )

      console.log("Client: RPC result", {
        error,
        dataLength: filteredData?.length,
      })

      if (error) throw new Error(error.message)

      return {
        data: (filteredData || []).map((result) => ({
          id: result.id,
          name: result.name,
          demo_code: result.demo_code,
          preview_url: result.preview_url,
          video_url: result.video_url,
          compiled_css: result.compiled_css,
          demo_dependencies: result.demo_dependencies,
          demo_direct_registry_dependencies:
            result.demo_direct_registry_dependencies,
          demo_slug: result.demo_slug,
          component: {
            ...(result.component_data as Component),
            user: result.user_data,
          } as Component & { user: User },
          created_at: result.created_at,
          updated_at: result.updated_at,
        })) as DemoWithComponent[],
        total_count: filteredData?.[0]?.total_count ?? 0,
      }
    },
    initialData: {
      data: initialComponents,
      total_count: initialComponents.length,
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  useEffect(() => {
    if (sortBy !== undefined && quickFilter !== undefined) {
      async function refetchData() {
        await queryClient.invalidateQueries({
          queryKey: ["tag-filtered-demos", tagSlug, quickFilter, sortBy],
        })
        await queryClient.refetchQueries({
          queryKey: ["tag-filtered-demos", tagSlug, quickFilter, sortBy],
        })
      }
      refetchData()
    }
  }, [sortBy, quickFilter, queryClient, tagSlug])

  return (
    <div className="container mx-auto mt-20">
      <TagComponentsHeader
        filtersDisabled={!!searchQuery}
        tabCounts={tabCounts!}
        currentSection={tagName}
      />
      <ComponentsList components={data.data} isLoading={isLoading} />
    </div>
  )
}
