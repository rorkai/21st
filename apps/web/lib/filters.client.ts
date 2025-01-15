import {
  Component,
  QuickFilterOption,
  SortOption,
  User,
  DemoWithComponent,
} from "@/types/global"

type ComponentWithUser = Component & { user: User }
type FilterableComponent = ComponentWithUser | DemoWithComponent

// TODO: move to server when we have more components and infinite pagination on home/category pages

export function filterComponents(
  items: FilterableComponent[],
  quickFilter: QuickFilterOption,
) {
  let filtered = [...items]

  switch (quickFilter) {
    case "all":
      break
    case "last_released":
      filtered = filtered.filter((item) => {
        const component = isDemoWithComponent(item) ? item.component : item
        const date = new Date(component.created_at)
        const now = new Date()
        const diffDays = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        )
        return diffDays < 7
      })
      break
    case "most_downloaded":
      filtered = filtered.filter((item) => {
        const component = isDemoWithComponent(item) ? item.component : item
        return (component.downloads_count || 0) > 6
      })
      break
  }

  return filtered
}

export function sortComponents(
  items: FilterableComponent[],
  sortBy: SortOption,
) {
  return [...items].sort((a, b) => {
    const componentA = isDemoWithComponent(a) ? a.component : a
    const componentB = isDemoWithComponent(b) ? b.component : b

    switch (sortBy) {
      case "downloads":
        return (
          (componentB.downloads_count || 0) - (componentA.downloads_count || 0)
        )
      case "likes":
        return (componentB.likes_count || 0) - (componentA.likes_count || 0)
      case "date":
        const dateA = new Date(componentA.created_at).getTime()
        const dateB = new Date(componentB.created_at).getTime()
        return dateB - dateA
      default:
        return (
          (componentB.downloads_count || 0) - (componentA.downloads_count || 0)
        )
    }
  })
}

function isDemoWithComponent(
  item: FilterableComponent,
): item is DemoWithComponent {
  return "component" in item
}
