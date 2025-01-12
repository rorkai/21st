"use client"

import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

// Utility function to format numbers like GitHub (e.g., 1.2K, 2.3M)
function formatStars(count: number): string {
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return count.toString()
}

export function GitHubStars() {
  const { data: stars, isLoading } = useQuery({
    queryKey: ["github-stars"],
    queryFn: async () => {
      const res = await fetch("https://api.github.com/repos/rorkai/21st")
      const data = await res.json()
      return data.stargazers_count as number
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })

  return (
    <span className="relative ms-3 inline-flex h-full items-center justify-center rounded-full px-3 text-xs font-medium text-muted-foreground before:absolute before:inset-0 before:left-0 before:w-px before:bg-input">
      {isLoading ? <Skeleton className="h-4 w-4" /> : formatStars(stars ?? 0)}
    </span>
  )
}
