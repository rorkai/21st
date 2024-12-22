"use client"

import { ComponentsList } from "@/components/ComponentsList"
import { ComponentsHeader } from "@/components/ComponentsHeader"
import { Component, User } from "@/types/global"
import { useAtom } from "jotai"
import { sortByAtom } from "@/components/ComponentsHeader"
import { useMemo } from "react"

export function TagPageContent({ components }: { components: (Component & { user: User })[] }) {
  const [sortBy] = useAtom(sortByAtom)
  
  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => {
      switch (sortBy) {
        case "installations":
          return (b.downloads_count || 0) - (a.downloads_count || 0)
        case "popular":
          return (b.likes_count || 0) - (a.likes_count || 0)
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })
  }, [components, sortBy])

  return (
    <>
      <ComponentsHeader totalCount={components.length} />
      <ComponentsList components={sortedComponents} className="mt-6" />
    </>
  )
} 