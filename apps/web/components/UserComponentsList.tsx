"use client"

import { useAtom, useAtomValue } from "jotai"
import { ComponentsList } from "@/components/ComponentsList"
import { searchQueryAtom } from "@/components/Header"
import { userComponentsTabAtom } from "@/components/UserComponentsHeader"
import { Component, DemoWithComponent, User } from "@/types/global"
import { useQuery } from "@tanstack/react-query"

export function UserComponentsList({
  user,
  publishedComponents = [],
  huntedComponents = [],
  userDemos = [],
}: {
  user: User
  publishedComponents?: (Component & { user: User })[]
  huntedComponents?: (Component & { user: User })[]
  userDemos?: DemoWithComponent[]
}) {
  const activeTab = useAtomValue(userComponentsTabAtom)
  const [searchQuery] = useAtom(searchQueryAtom)

  const getBaseComponents = () => {
    switch (activeTab) {
      case "published":
        return publishedComponents
      case "hunted":
        return huntedComponents
      case "demos":
        return userDemos
      default:
        return publishedComponents
    }
  }

  const baseComponents = getBaseComponents()

  const { data: components, isLoading } = useQuery({
    queryKey: ["user-components", user.id, activeTab, searchQuery],
    queryFn: async () => {
      if (!searchQuery) return baseComponents

      const query = searchQuery.toLowerCase()
      return baseComponents.filter((component) => {
        return (
          ("name" in component
            ? component.name?.toLowerCase().includes(query)
            : false) ||
          ("description" in component
            ? component.description?.toLowerCase().includes(query)
            : false) ||
          ("component" in component
            ? component.component.user.name?.toLowerCase().includes(query) ||
              component.component.user.username?.toLowerCase().includes(query)
            : component.user.name?.toLowerCase().includes(query) ||
              component.user.username?.toLowerCase().includes(query))
        )
      })
    },
    initialData: baseComponents,
    refetchOnWindowFocus: false,
  })

  return <ComponentsList components={components} isLoading={isLoading} />
}
