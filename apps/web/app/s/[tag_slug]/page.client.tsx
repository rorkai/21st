"use client"

import { useAtom } from "jotai"
import { useQuery } from "@tanstack/react-query"
import { ComponentsList } from "@/components/ComponentsList"
import { quickFilterAtom, sortByAtom } from "@/components/ComponentsHeader"
import { searchQueryAtom } from "@/components/Header"
import { filterComponents } from "@/lib/filters.client"
import {
  DemoWithComponent,
  QuickFilterOption,
  SortOption
} from "@/types/global"
import { TagComponentsHeader } from "@/components/TagComponentsHeader"
import { useLayoutEffect, useState } from "react"

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

  const { data: filteredComponents, isLoading } = useQuery<DemoWithComponent[]>(
    {
      queryKey: ["tag-components", tagName, sortBy, quickFilter, searchQuery],
      queryFn: async () => {
        let filtered = demos

        if (!sortBy || !quickFilter) {
          return filtered
        }

        const componentsForFilter = filtered.map((d) => ({
          ...d.component,
          user: d.user,
        }))
        const filteredComponents = filterComponents(
          componentsForFilter,
          quickFilter,
        )

        return filtered.filter((demo) =>
          filteredComponents.some((comp) => comp.id === demo.component.id),
        )
      },
      initialData: demos,
      staleTime: 0,
    },
  )

  return (
    <div className="container mx-auto mt-20">
      <TagComponentsHeader
        filtersDisabled={!!searchQuery}
        demos={demos}
        currentSection={tagName}
      />
      <ComponentsList components={filteredComponents} isLoading={isLoading} />
    </div>
  )
}
