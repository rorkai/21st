"use client"

import React, { useEffect, useState, useCallback } from "react"

import { useAtom } from "jotai"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import debounce from "lodash/debounce"

import {
  Component,
  QuickFilterOption,
  SortOption,
  User,
  ComponentWithUser,
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

const useTrackHasOnboarded = () => {
  useEffect(() => {
    setCookie({
      name: "has_onboarded",
      value: "true",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
    })
  }, [])
}

export function HomePageClient({
  initialComponents,
  initialSortBy,
  initialQuickFilter,
  componentsTotalCount,
}: {
  initialComponents: (Component & { user: User })[]
  initialSortBy: SortOption
  initialQuickFilter: QuickFilterOption
  componentsTotalCount: number
}) {
  const [searchQuery] = useAtom(searchQueryAtom)
  const supabase = useClerkSupabaseClient()
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [quickFilter, setQuickFilter] = useAtom(quickFilterAtom)
  const [isStorageLoaded, setIsStorageLoaded] = useState(false)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  const [debouncedQuickFilter, setDebouncedQuickFilter] = useState(quickFilter)
  const [tabCounts, setTabCounts] = useState<Record<QuickFilterOption, number>>(
    {
      all: initialComponents.length,
      last_released: 0,
      most_downloaded: 0,
    },
  )

  // Initialize atoms from localStorage or use initial values
  useEffect(() => {
    const storedSortBy = localStorage.getItem("components-sort-by")
    const storedQuickFilter = localStorage.getItem("quick-filter")

    if (!storedSortBy) {
      setSortBy(initialSortBy)
    }
    if (!storedQuickFilter) {
      setQuickFilter(initialQuickFilter)
    }
    setIsStorageLoaded(true)
  }, [])

  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value)
    }, 300),
    [],
  )

  const debouncedSetQuickFilter = useCallback(
    debounce((value: QuickFilterOption) => {
      setDebouncedQuickFilter(value)
    }, 100),
    [],
  )

  useEffect(() => {
    if (isStorageLoaded) {
      debouncedSetSearchQuery(searchQuery)
    }
    return () => {
      debouncedSetSearchQuery.cancel()
    }
  }, [searchQuery, debouncedSetSearchQuery, isStorageLoaded])

  useEffect(() => {
    if (isStorageLoaded) {
      debouncedSetQuickFilter(quickFilter)
    }
    return () => {
      debouncedSetQuickFilter.cancel()
    }
  }, [quickFilter, debouncedSetQuickFilter, isStorageLoaded])

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: [
        "filtered-components",
        debouncedQuickFilter,
        sortBy,
        debouncedSearchQuery,
      ],
      queryFn: async ({ pageParam = 0 }) => {
        if (!debouncedSearchQuery) {
          const { data: filteredData, error } = await supabase.rpc(
            "get_filtered_components",
            {
              p_quick_filter: debouncedQuickFilter,
              p_sort_by: sortBy,
              p_offset: Number(pageParam) * 24,
              p_limit: 24,
            },
          )

          if (error) {
            throw new Error(error.message || `HTTP error: ${status}`)
          }

          const data = filteredData || []
          if (data.length === 0) {
            return {
              data: [],
              total_count: 0,
            }
          }

          const components = data.map((item) => ({
            ...item,
            user: item.user_data as User,
            compiled_css: null,
            fts: null,
            global_css_extension: null,
            hunter_username: null,
            is_paid: false,
            payment_url: null,
            price: 0,
            pro_preview_image_url: null,
            website_url: null,
            tailwind_config_extension: null,
            video_url: item.video_url || null,
          })) as ComponentWithUser[]

          return {
            data: components,
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

        const components = searchResults.map((result) => {
          const userData = result.user_data as Record<string, unknown>
          return {
            id: result.id,
            component_names: result.component_names,
            description: result.description,
            code: result.code,
            demo_code: result.demo_code,
            created_at: result.created_at,
            updated_at: result.updated_at,
            user_id: result.user_id,
            dependencies: result.dependencies,
            is_public: result.is_public,
            downloads_count: result.downloads_count || 0,
            likes_count: result.likes_count,
            component_slug: result.component_slug,
            name: result.name,
            demo_dependencies: result.demo_dependencies,
            registry: result.registry,
            direct_registry_dependencies: result.direct_registry_dependencies,
            demo_direct_registry_dependencies:
              result.demo_direct_registry_dependencies,
            preview_url: result.preview_url,
            license: result.license,
            compiled_css: null,
            global_css_extension: null,
            hunter_username: null,
            is_paid: false,
            payment_url: null,
            price: 0,
            pro_preview_image_url: null,
            video_url: result.video_url,
            website_url: null,
            user: userData as User,
            fts: null,
          }
        }) as ComponentWithUser[]

        return {
          data: components,
          total_count: components.length,
        }
      },
      enabled: isStorageLoaded,
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

  const allComponents = data?.pages.flatMap((page) => page.data)

  const showSkeleton = isLoading || !data?.pages?.[0]?.data?.length
  const showSpinner = isFetching && !showSkeleton

  const { data: tabCountsData } = useQuery({
    queryKey: ["tab-counts", debouncedSearchQuery],
    queryFn: async () => {
      const counts: Record<QuickFilterOption, number> = {
        all: 0,
        last_released: 0,
        most_downloaded: 0,
      }

      if (debouncedSearchQuery) {
        // For search, we'll use the total count from the search results
        return counts
      }

      const { data, error } = await supabase.rpc("get_components_counts")

      if (!error && Array.isArray(data)) {
        data.forEach((item: any) => {
          if (
            typeof item.filter_type === "string" &&
            typeof item.count === "number" &&
            item.filter_type in counts
          ) {
            counts[item.filter_type as QuickFilterOption] = item.count
          }
        })
      }

      return counts
    },
    enabled: isStorageLoaded,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (data?.pages[0]) {
      setTotalCount(data.pages[0].total_count)
    }
    if (tabCountsData) {
      setTabCounts(tabCountsData)
    }
  }, [data?.pages, tabCountsData])

  useTrackHasOnboarded()

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
          tabCounts={tabCounts}
        />
        {showSkeleton ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <ComponentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
            {allComponents?.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                isLoading={false}
              />
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
