"use client"

import { useAtom } from "jotai"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ComponentsList } from "@/components/ui/items-list"
import {
  quickFilterAtom,
  sortByAtom,
} from "@/components/features/main-page/main-page-header"
import { searchQueryAtom } from "@/components/ui/header.client"
import {
  DemoWithComponent,
  QuickFilterOption,
  SortOption,
} from "@/types/global"
import { TagComponentsHeader } from "@/components/features/tag-page/tag-page-header"
import { useLayoutEffect, useState, useEffect } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { transformDemoResult } from "@/lib/utils/transformData"

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
      if (!quickFilter || !sortBy) {
        return { data: [], total_count: 0 }
      }

      const { data: filteredData, error } = await supabase.rpc(
        "get_filtered_demos_with_views",
        {
          p_quick_filter: quickFilter,
          p_sort_by: sortBy,
          p_offset: 0,
          p_limit: 40,
          p_tag_slug: tagSlug,
        },
      )

      if (error) throw new Error(error.message)

      const transformedData = (filteredData || []).map(transformDemoResult)

      return {
        data: transformedData,
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
    <div className="container mx-auto mt-20 px-4">
      <TagComponentsHeader
        filtersDisabled={!!searchQuery}
        tabCounts={tabCounts!}
        currentSection={tagName}
      />
      <ComponentsList components={data.data} isLoading={isLoading} />
    </div>
  )
}
