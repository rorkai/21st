"use client"

import { useAtom, useAtomValue } from "jotai"
import { ComponentsList } from "@/components/ComponentsList"
import { searchQueryAtom } from "@/components/Header"
import { userComponentsTabAtom } from "@/components/UserComponentsHeader"
import { Component, User } from "@/types/global"

interface UserComponentsListProps {
  publishedComponents?: (Component & { user: User })[]
  huntedComponents?: (Component & { user: User })[]
}

export function UserComponentsList({
  publishedComponents = [],
  huntedComponents = [],
}: UserComponentsListProps) {
  const activeTab = useAtomValue(userComponentsTabAtom)
  const [searchQuery] = useAtom(searchQueryAtom)

  const filterComponents = (components: (Component & { user: User })[]) => {
    if (!searchQuery) return components

    const query = searchQuery.toLowerCase()
    return components.filter((component) => {
      return (
        component.name.toLowerCase().includes(query) ||
        component.description?.toLowerCase().includes(query) ||
        component.user.name?.toLowerCase().includes(query) ||
        (component.user.username &&
          component.user.username.toLowerCase().includes(query))
      )
    })
  }

  const components =
    activeTab === "published"
      ? filterComponents(publishedComponents)
      : filterComponents(huntedComponents)

  return <ComponentsList components={components} />
}
