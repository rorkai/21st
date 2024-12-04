"use client"

import { useQuery } from "@tanstack/react-query"

export function GitHubStars() {
  const { data: stars, isLoading } = useQuery({
    queryKey: ['github-stars'],
    queryFn: async () => {
      const res = await fetch('https://api.github.com/repos/rorkai/21st')
      const data = await res.json()
      return data.stargazers_count as number
    },
    staleTime: 1000 * 60 * 5, // Кэшируем на 5 минут
    retry: 2
  })

  if (isLoading) return null

  return (
    <span className="text-sm">
     Star {stars?.toLocaleString()}
    </span>
  )
} 