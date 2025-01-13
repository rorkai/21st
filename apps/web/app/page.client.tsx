"use client"

import React, { useEffect, useLayoutEffect, useState } from "react"

import { useAtom } from "jotai"
import { useInfiniteQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"

import {
  Component,
  QuickFilterOption,
  SortOption,
  User,
  DemoWithComponent,
  Tag,
} from "@/types/global"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { setCookie } from "@/lib/cookies"

import {
  ComponentCard,
  ComponentCardSkeleton,
} from "@/components/ComponentCard"
import { searchQueryAtom } from "@/components/Header"
import {
  ComponentsHeader,
  sortByAtom,
  quickFilterAtom,
} from "@/components/ComponentsHeader"
import { Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

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

export function HomePageClient({
  initialSortBy,
  initialQuickFilter,
  initialTabsCounts,
}: {
  initialComponents: (Component & { user: User })[]
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
      queryFn: async ({ pageParam = 0 }) => {
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

          if (error) {
            throw new Error(error.message)
          }

          const data = filteredData || []
          if (data.length === 0) {
            return {
              data: [],
              total_count: 0,
            }
          }

          const demos = data.map((item) => ({
            id: item.id,
            name: item.name,
            demo_code: item.demo_code,
            preview_url: item.preview_url,
            video_url: item.video_url,
            compiled_css: item.compiled_css,
            demo_dependencies: item.demo_dependencies,
            demo_direct_registry_dependencies:
              item.demo_direct_registry_dependencies,
            pro_preview_image_url: item.pro_preview_image_url,
            created_at: item.created_at,
            updated_at: item.updated_at,
            component_id: item.component_id,
            component: item.component_data as Component,
            user: item.user_data as User,
            tags: item.tags as Tag[],
          })) as DemoWithComponent[]

          return {
            data: demos,
            total_count: data[0]?.total_count ?? 0,
          }
        }

        const { data: searchData, error } = await supabase.rpc(
          "search_components",
          {
            search_query: debouncedSearchQuery,
          },
        )

        if (error) {
          throw new Error(error.message)
        }

        const searchResults = searchData || []
        if (searchResults.length === 0) {
          return {
            data: [],
            total_count: 0,
          }
        }

        // Преобразуем результаты поиска компонентов в формат DemoWithComponent
        const demos = searchResults.map((result) => ({
          id: result.id, // используем id компонента как id демо
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
          component_id: result.id,
          component: {
            id: result.id,
            name: result.name,
            component_slug: result.component_slug,
            downloads_count: result.downloads_count || 0,
            likes_count: result.likes_count,
            license: result.license,
            is_public: result.is_public,
            user_id: result.user_id,
          } as Component,
          user: result.user_data as User,
          tags: [],
        })) as DemoWithComponent[]

        return {
          data: demos,
          total_count: demos.length,
        }
      },
      enabled: true,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: false,
      initialPageParam: 0,
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto mt-20"
    >
      <div className="flex flex-col">
        <ComponentsHeader
          filtersDisabled={!!searchQuery}
          tabCounts={tabCounts!}
        />
        {showSkeleton ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <ComponentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
            {allDemos?.map((demo) => (
              <ComponentCard key={demo.id} demo={demo} isLoading={false} />
            ))}
          </div>
        )}
        {showSpinner && (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
