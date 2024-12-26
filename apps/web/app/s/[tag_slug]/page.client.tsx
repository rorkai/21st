"use client"

import { ComponentsList } from "@/components/ComponentsList"
import {
  ComponentsHeader,
  quickFilterAtom,
} from "@/components/ComponentsHeader"
import { Component, User } from "@/types/global"
import { useAtom } from "jotai"
import { sortByAtom } from "@/components/ComponentsHeader"
import { searchQueryAtom } from "@/components/Header"
import { useMemo } from "react"
import { sortComponents, filterComponents } from "@/lib/filters.client"

export function TagPageContent({
  components,
}: {
  components: (Component & { user: User })[]
}) {
  const [sortBy] = useAtom(sortByAtom)
  const [quickFilter] = useAtom(quickFilterAtom)
  const [searchQuery] = useAtom(searchQueryAtom)

  const filteredSortedComponents = useMemo(() => {
    if (!components || !sortBy || !quickFilter) return undefined

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

    return sortComponents(filterComponents(filtered, quickFilter), sortBy)
  }, [components, sortBy, quickFilter, searchQuery])

  return (
    <>
      <ComponentsHeader
        filtersDisabled={false}
        components={components}
      />
      <ComponentsList components={filteredSortedComponents} className="mt-6" />
    </>
  )
}
