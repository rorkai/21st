"use client"

import { useAtom } from "jotai"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useMemo } from "react"

import { Component, QuickFilterOption, SortOption, User } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { sortComponents, filterComponents } from "@/lib/filters.client"
import { setCookie } from "@/lib/cookies"

import { ComponentCard } from "@/components/ComponentCard"
import { Skeleton } from "@/components/ui/skeleton"
import { searchQueryAtom } from "@/components/Header"
import {
  ComponentsHeader,
  sortByAtom,
  quickFilterAtom,
} from "@/components/ComponentsHeader"

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

  if (sortBy === undefined) {
    // @ts-ignore
    setSortBy(initialSortBy)
  }
  if (quickFilter === undefined) {
    // @ts-ignore
    setQuickFilter(initialQuickFilter)
  }

  const { data: components } = useQuery<(Component & { user: User })[]>({
    queryKey: ["components", searchQuery],
    queryFn: async () => {
      if (!searchQuery) {
        const { data, error } = await supabase
          .from("components")
          .select("*, user:users!user_id (*)")
          .limit(1000)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .returns<(Component & { user: User })[]>()

        if (error) {
          throw new Error(error.message || `HTTP error: ${status}`)
        }
        return data
      }
      const { data: searchResults, error } = await supabase.rpc(
        "search_components",
        {
          search_query: searchQuery,
        },
      )
      if (error) {
        throw new Error(error.message || `HTTP error: ${status}`)
      }
      return searchResults.map((result) => ({
        ...result,
        user: result.user_data as User,
        fts: undefined,
      })) as (Component & { user: User })[]
    },
    initialData: sortBy === undefined ? initialComponents : [],
    refetchOnWindowFocus: false,
    retry: false,
  })

  const filteredAndSortedComponents = useMemo(() => {
    if (searchQuery) return components
    if (!components || !quickFilter || !sortBy) return undefined
    return sortComponents(filterComponents(components, quickFilter), sortBy)
  }, [components, searchQuery, quickFilter, sortBy])

  useTrackHasOnboarded()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto mt-20"
    >
      <div className="flex flex-col">
        <ComponentsHeader
          filtersDisabled={!!searchQuery}
          components={components}
        />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
          {filteredAndSortedComponents?.map((component) => (
            <ComponentCard key={component.id} component={component} />
          ))}
          {components === undefined && (
            <>
              {[...Array(12)].map((_, index) => (
                <div key={index} className="overflow-hidden">
                  <div className="relative aspect-[4/3] mb-3">
                    <Skeleton className="w-full h-full rounded-lg" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center space-x-2 ml-auto">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
