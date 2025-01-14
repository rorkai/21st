"use client"

import { useAtom, useAtomValue } from "jotai"
import { ComponentsList } from "@/components/ComponentsList"
import { searchQueryAtom } from "@/components/Header"
import { userComponentsTabAtom } from "@/components/UserComponentsHeader"
import { Component, User } from "@/types/global"
import { useQuery } from "@tanstack/react-query"

export function UserComponentsList({
  user,
  publishedComponents = [],
  huntedComponents = [],
}: {
  user: User
  publishedComponents?: (Component & { user: User })[]
  huntedComponents?: (Component & { user: User })[]
}) {
  const activeTab = useAtomValue(userComponentsTabAtom)
  const [searchQuery] = useAtom(searchQueryAtom)
  const baseComponents =
    activeTab === "published" ? publishedComponents : huntedComponents

  const { data: components, isLoading } = useQuery<
    (Component & { user: User })[]
  >({
    queryKey: ["user-components", user.id, activeTab, searchQuery],
    queryFn: async () => {
      if (!searchQuery) return baseComponents

      const query = searchQuery.toLowerCase()
      return baseComponents.filter((component) => {
        return (
          component.name.toLowerCase().includes(query) ||
          component.description?.toLowerCase().includes(query) ||
          component.user.name?.toLowerCase().includes(query) ||
          (component.user.username &&
            component.user.username.toLowerCase().includes(query))
        )
      })
    },
    initialData: baseComponents,
    refetchOnWindowFocus: false,
  })

  return <ComponentsList components={components} isLoading={isLoading} />
}
