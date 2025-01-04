"use client"

import { useAtom } from "jotai"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useMemo } from "react"

import { Component, QuickFilterOption, SortOption, User } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { sortComponents, filterComponents } from "@/lib/filters.client"
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
}: {
  initialComponents: (Component & { user: User })[]
  initialSortBy: SortOption
  initialQuickFilter: QuickFilterOption
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

  const { data: components, isLoading } = useQuery<
    (Component & { user: User })[]
  >({
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
        throw new Error(error.message)
      }
      return searchResults.map((result) => ({
        ...result,
        user: result.user_data as User,
        downloads_count: result.downloads_count || 0,
        fts: null,
      })) as unknown as (Component & { user: User })[]
    },
    initialData: undefined,
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
          components={isLoading ? initialComponents : components}
        />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
          {filteredAndSortedComponents?.map((component) => (
            <ComponentCard key={component.id} component={component} />
          ))}
          {isLoading && (
            <>
              {Array.from({ length: 12 }).map((_, i) => (
                <ComponentCardSkeleton key={i} />
              ))}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
