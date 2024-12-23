"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function GitHubStars() {
  const { data: stars, isLoading } = useQuery({
    queryKey: ['github-stars'],
    queryFn: async () => {
      const res = await fetch('https://api.github.com/repos/rorkai/21st')
      const data = await res.json()
      return data.stargazers_count as number
    },
    staleTime: 1000 * 60 * 5,
    retry: 2
  })

  if (isLoading) return null

  return (
    <span className="relative ms-3 inline-flex h-full items-center justify-center rounded-full px-3 text-xs font-medium text-muted-foreground before:absolute before:inset-0 before:left-0 before:w-px before:bg-input">
      {stars}
    </span>
  )
} 