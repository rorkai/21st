"use client"

import { ComponentsList } from "@/components/ComponentsList"
import { ComponentsHeader } from "@/components/ComponentsHeader"
import { Component, User } from "@/types/global"
import { useAtom } from "jotai"
import { sortByAtom } from "@/components/ComponentsHeader"
import { useMemo } from "react"
import { sortComponents } from "@/lib/filters.client"

export function TagPageContent({
  components,
}: {
  components: (Component & { user: User })[]
}) {
  const [sortBy] = useAtom(sortByAtom)

  const sortedComponents = useMemo(() => {
    if (!components || !sortBy) return undefined
    return sortComponents(components, sortBy)
  }, [components, sortBy])

  return (
    <>
      <ComponentsHeader totalCount={components.length} filtersEnabled={true} />
      <ComponentsList components={sortedComponents} className="mt-6" />
    </>
  )
}
