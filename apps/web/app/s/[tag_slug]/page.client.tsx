"use client"

import { ComponentsList } from "@/components/ComponentsList"
import {
  ComponentsHeader,
  quickFilterAtom,
} from "@/components/ComponentsHeader"
import { Component, User } from "@/types/global"
import { useAtom } from "jotai"
import { sortByAtom } from "@/components/ComponentsHeader"
import { useMemo } from "react"
import { sortComponents, filterComponents } from "@/lib/filters.client"

export function TagPageContent({
  components,
}: {
  components: (Component & { user: User })[]
}) {
  const [sortBy] = useAtom(sortByAtom)
  const [quickFilter] = useAtom(quickFilterAtom)

  const filteredSortedComponents = useMemo(() => {
    if (!components || !sortBy || !quickFilter) return undefined
    return sortComponents(filterComponents(components, quickFilter), sortBy)
  }, [components, sortBy, quickFilter])

  return (
    <>
      <ComponentsHeader
        filtersDisabled={false}
        hideSearch={true}
        components={components}
      />
      <ComponentsList components={filteredSortedComponents} className="mt-6" />
    </>
  )
}
