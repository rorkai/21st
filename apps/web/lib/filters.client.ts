import { Component, QuickFilterOption, SortOption, User } from "@/types/global"

// TODO: move to server when we have more components and infinite pagination on home/category pages

export function filterComponents(
  components: (Component & { user: User })[],
  quickFilter: QuickFilterOption,
) {
  let filtered = [...components]

  switch (quickFilter) {
    case "all":
      break
    case "last_released":
      filtered = filtered.filter((c) => {
        const date = new Date(c.created_at)
        const now = new Date()
        const diffDays = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        )
        return diffDays < 7
      })
      break
    case "most_downloaded":
      filtered = filtered.filter((c) => (c.downloads_count || 0) > 6)
      break
  }

  return filtered
}

export function sortComponents(
  components: (Component & { user: User })[],
  sortBy: SortOption,
) {
  return [...components].sort((a, b) => {
    switch (sortBy) {
      case "downloads":
        return (b.downloads_count || 0) - (a.downloads_count || 0)
      case "likes":
        return (b.likes_count || 0) - (a.likes_count || 0)
      case "date":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      default:
        return (b.downloads_count || 0) - (a.downloads_count || 0)
    }
  })
}
