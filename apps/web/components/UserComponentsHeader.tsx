"use client"

import { useEffect, useRef } from "react"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { CircleX } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { searchQueryAtom } from "@/components/Header"
import { Component, User } from "@/types/global"

export type UserComponentsTab = "published" | "hunted"

export const userComponentsTabAtom = atomWithStorage<UserComponentsTab>(
  "user-components-tab",
  "published",
)

const useTrackSearchQueries = () => {
  const lastTrackedQuery = useRef<string | null>(null)
  const [searchQuery] = useAtom(searchQueryAtom)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery !== lastTrackedQuery.current) {
        lastTrackedQuery.current = searchQuery
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])
}

const useSearchHotkeys = (inputRef: React.RefObject<HTMLInputElement>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")
      ) {
        event.preventDefault()
        inputRef.current?.focus()
      } else if (event.key === "Escape") {
        inputRef.current?.blur()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])
}

interface UserComponentsHeaderProps {
  publishedComponents?: (Component & { user: User })[]
  huntedComponents?: (Component & { user: User })[]
  username: string
}

export function UserComponentsHeader({
  publishedComponents = [],
  huntedComponents = [],
  username,
}: UserComponentsHeaderProps) {
  const [activeTab, setActiveTab] = useAtom(userComponentsTabAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useTrackSearchQueries()
  useSearchHotkeys(inputRef)

  const handleClearInput = () => {
    setSearchQuery("")
    inputRef.current?.focus()
  }

  const getSearchPlaceholder = () => {
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1200px)")
    if (isTablet) return "Search..."
    return `${username}'s components...`
  }

  const tabs = [
    {
      value: "published" as const,
      label: "Published",
      count: publishedComponents?.length ?? 0,
    },
    {
      value: "hunted" as const,
      label: "Hunted",
      count: huntedComponents?.length ?? 0,
    },
  ]

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as UserComponentsTab)}
            className="w-full md:w-auto"
          >
            <TabsList className="w-full md:w-auto h-8 -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
              {tabs.map(({ value, label, count }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  disabled={count === 0}
                  className="flex-1 md:flex-initial relative overflow-hidden rounded-none border border-border h-8 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 md:w-auto min-w-0">
          <div className="relative flex-1 min-w-0 lg:min-w-[250px] md:min-w-[100px]">
            <Input
              ref={inputRef}
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 min-w-[100px] [&::placeholder]:pe-8 lg:[&::placeholder]:pe-16"
            />
            {searchQuery ? (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-8 md:w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                onClick={handleClearInput}
                aria-label="Clear search"
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            ) : (
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
                <kbd className="hidden lg:inline-flex size-5 items-center justify-center rounded border bg-muted px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                  <span className="text-[11px] font-sans">/</span>
                </kbd>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
