"use client"

import { useAtom, useAtomValue } from "jotai"
import { ComponentsList } from "@/components/ui/items-list"
import { searchQueryAtom } from "@/components/ui/header.client"
import { userComponentsTabAtom } from "@/components/features/user-page/user-page-header"
import { Component, DemoWithComponent, User } from "@/types/global"
import { useQuery } from "@tanstack/react-query"

type ComponentOrDemo = DemoWithComponent | (Component & { user: User })

export function UserComponentsList({
  user,
  publishedComponents = [],
  huntedComponents = [],
  userDemos = [],
}: {
  user: User
  publishedComponents?: DemoWithComponent[]
  huntedComponents?: (Component & { user: User })[]
  userDemos?: DemoWithComponent[]
}) {
  const activeTab = useAtomValue(userComponentsTabAtom)
  const [searchQuery] = useAtom(searchQueryAtom)

  const getBaseComponents = (): ComponentOrDemo[] => {
    let result: ComponentOrDemo[] = []

    switch (activeTab) {
      case "published":
        result = publishedComponents
        break
      case "hunted":
        // Transform hunted components to match DemoWithComponent structure
        result = huntedComponents.map((component) => {
          return {
            id: component.id,
            name: component.name || "",
            demo_code: component.demo_code || "",
            preview_url: component.preview_url || "",
            video_url: component.video_url || null,
            compiled_css: component.compiled_css || null,
            demo_dependencies: component.demo_dependencies || null,
            demo_direct_registry_dependencies:
              component.direct_registry_dependencies || null,
            demo_slug: "default",
            component_id: component.id,
            user_id: component.user_id,
            pro_preview_image_url: component.pro_preview_image_url || null,
            created_at: component.created_at,
            updated_at: component.updated_at,
            fts: null,
            component: component,
            user: component.user,
            tags: [],
          }
        })
        break
      case "demos":
        result = userDemos
        break
      default:
        result = publishedComponents
    }
    return result
  }

  const baseComponents = getBaseComponents()

  const { data: components, isLoading } = useQuery({
    queryKey: ["user-components", user.id, activeTab, searchQuery],
    queryFn: async () => {
      if (!searchQuery) return baseComponents

      if (!searchQuery) return baseComponents

      const query = searchQuery.toLowerCase()
      const filtered = baseComponents.filter((component: ComponentOrDemo) => {
        const componentName = component.name || ""
        const componentDescription =
          "description" in component ? component.description || "" : ""
        const userName =
          "component" in component
            ? component.component.user.name || ""
            : component.user.name || ""
        const userUsername =
          "component" in component
            ? component.component.user.username || ""
            : component.user.username || ""

        return (
          componentName.toLowerCase().includes(query) ||
          componentDescription.toLowerCase().includes(query) ||
          userName.toLowerCase().includes(query) ||
          userUsername.toLowerCase().includes(query)
        )
      })

      return filtered
    },
    initialData: baseComponents,
    refetchOnWindowFocus: false,
  })

  return <ComponentsList components={components} isLoading={isLoading} />
}
