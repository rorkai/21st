"use client"

import React, { useEffect, useLayoutEffect, useState } from "react"

import { useAtom } from "jotai"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"

import {
  Component,
  QuickFilterOption,
  SortOption,
  User,
  DemoWithComponent,
  Tag,
  Demo,
} from "@/types/global"
import type { Json } from "@/types/supabase"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { setCookie } from "@/lib/cookies"
import { searchQueryAtom } from "@/components/Header"
import {
  ComponentsHeader,
  sortByAtom,
  quickFilterAtom,
} from "@/components/ComponentsHeader"
import { Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import ComponentsList from "@/components/ComponentsList"
import { transformDemoResult } from "@/lib/utils/transformData"

type SearchResult = {
  id: number
  name: string
  demo_code: string
  preview_url: string
  video_url: string
  created_at: string
  updated_at: string
  component_id: number
  demo_dependencies: Json
  demo_direct_registry_dependencies: Json
  demo_slug: string
  compiled_css: string | null
  user_id: string | null
  component_data: Json
  user_data: Json
}

const useSetServerUserDataCookies = () => {
  useEffect(() => {
    if (!document.cookie.includes("has_onboarded")) {
      setCookie({
        name: "has_onboarded",
        value: "true",
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "lax",
      })
    }
  }, [])
}

const refetchData = async (queryClient: any, quickFilter: any, sortBy: any) => {
  await queryClient.invalidateQueries({
    queryKey: ["filtered-demos", quickFilter, sortBy],
  })
}

export function HomePageClient({
  initialComponents,
  initialSortBy,
  initialQuickFilter,
  initialTabsCounts,
}: {
  initialComponents: DemoWithComponent[]
  initialSortBy: SortOption
  initialQuickFilter: QuickFilterOption
  initialTabsCounts: Record<QuickFilterOption, number>
}) {
  const [searchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [quickFilter, setQuickFilter] = useAtom(quickFilterAtom)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [tabCounts, setTabCounts] = useState<
    Record<QuickFilterOption, number> | undefined
  >(initialTabsCounts)
  const queryClient = useQueryClient()

  // Important: we don't need useEffect here
  // https://react.dev/learn/you-might-not-need-an-effect
  if (tabCounts === undefined) {
    setTabCounts(initialTabsCounts)
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

  useSetServerUserDataCookies()

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery<{ data: DemoWithComponent[]; total_count: number }>({
      queryKey: ["filtered-demos", quickFilter, sortBy, debouncedSearchQuery],
      queryFn: async ({
        pageParam = 0,
      }): Promise<{ data: DemoWithComponent[]; total_count: number }> => {
        if (!quickFilter || !sortBy) {
          return {
            data: [],
            total_count: 0,
          }
        }

        if (!debouncedSearchQuery) {
          const { data: filteredData, error } = await supabase.rpc(
            "get_filtered_demos",
            {
              p_quick_filter: quickFilter,
              p_sort_by: sortBy,
              p_offset: Number(pageParam) * 24,
              p_limit: 24,
            },
          )

          if (error) throw new Error(error.message)
          const transformedData = (filteredData || []).map(transformDemoResult)
          return {
            data: transformedData,
            total_count: filteredData?.[0]?.total_count ?? 0,
          }
        }

        const { data: searchResults, error } = await supabase.rpc(
          "search_demos",
          {
            search_query: debouncedSearchQuery,
          },
        )

        if (error) throw new Error(error.message)
        const transformedSearchResults = (searchResults || []).map(
          transformDemoResult,
        )

        return {
          data: transformedSearchResults,
          total_count: transformedSearchResults.length,
        }
      },
      initialData: {
        pages: [
          { data: initialComponents, total_count: initialComponents.length },
        ],
        pageParams: [0],
      },
      enabled: true,
      staleTime: 0,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: false,
      initialPageParam: 0,
      refetchOnMount: true,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage?.data || lastPage.data.length === 0) return undefined
        const loadedCount = allPages.reduce(
          (sum, page) => sum + page.data.length,
          0,
        )
        return loadedCount < lastPage.total_count ? allPages.length : undefined
      },
    })
  const allDemos = data?.pages?.flatMap((d) => d.data)

  const showSkeleton = isLoading || !data?.pages?.[0]?.data?.length
  const showSpinner = isFetching && !showSkeleton

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 1000 &&
        !isLoading &&
        hasNextPage
      ) {
        fetchNextPage()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isLoading, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (sortBy !== undefined && quickFilter !== undefined) {
      refetchData(queryClient, quickFilter, sortBy)
    }
  }, [sortBy, quickFilter, queryClient])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto mt-20 px-4"
    >
      <div className="flex flex-col">
        <ComponentsHeader
          filtersDisabled={!!searchQuery}
          tabCounts={tabCounts!}
        />
        <ComponentsList components={allDemos} isLoading={isLoading} />
        {showSpinner && (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
