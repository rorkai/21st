"use client"

import { useAtom, Atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SortOption, QuickFilterOption } from "@/types/global"
import { QUICK_FILTER_OPTIONS, SORT_OPTIONS } from "@/types/global"
import { Input } from "@/components/ui/input"
import { useMediaQuery } from "@/hooks/use-media-query"
import { searchQueryAtom } from "@/components/Header"
import { useEffect, useRef } from "react"
import { ArrowUpDown, CircleX } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { cn } from "@/lib/utils"
import { Component, User } from "@/types/global"
import { filterComponents } from "@/lib/filters.client"

export const quickFilterAtom = atomWithStorage<QuickFilterOption | undefined>(
  "quick-filter",
  undefined,
)

export const sortByAtom: Atom<SortOption | undefined> = atomWithStorage(
  "components-sort-by",
  undefined,
)

const useTrackSearchQueries = () => {
  const lastTrackedQuery = useRef<string | null>(null)
  const [searchQuery] = useAtom(searchQueryAtom)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery !== lastTrackedQuery.current) {
        trackEvent(AMPLITUDE_EVENTS.SEARCH_COMPONENTS, {
          query: searchQuery,
        })
        lastTrackedQuery.current = searchQuery
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])
}

const useSearchHotkeys = (inputRef: React.RefObject<HTMLInputElement>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
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

const getFilteredCount = (
  components: (Component & { user: User })[],
  filter: QuickFilterOption,
) => {
  if (!components) return 0
  return filterComponents(components, filter).length
}

export function ComponentsHeader({
  filtersDisabled,
  hideSearch = false,
  components,
}: {
  filtersDisabled: boolean
  hideSearch?: boolean
  components?: (Component & { user: User })[]
}) {
  const [quickFilter, setQuickFilter] = useAtom(quickFilterAtom)
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isMobile = useMediaQuery("(max-width: 768px)")

  useTrackSearchQueries()
  useSearchHotkeys(inputRef)

  const handleClearInput = () => {
    setSearchQuery("")
    inputRef.current?.focus()
  }

  const getFilterLabel = (label: string) => {
    if (isMobile && label === "All Components") {
      return "All"
    }
    return label
  }

  useEffect(() => {
    if (components && quickFilter) {
      const currentFilterCount = getFilteredCount(components, quickFilter)
      if (currentFilterCount === 0) {
        setQuickFilter("all")
      }
    }
  }, [components, quickFilter, setQuickFilter])

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Tabs
            value={quickFilter}
            onValueChange={(value) =>
              setQuickFilter(value as QuickFilterOption)
            }
            className={cn("w-full md:w-auto", filtersDisabled && "opacity-50")}
          >
            <TabsList className="w-full md:w-auto h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
              {Object.entries(QUICK_FILTER_OPTIONS).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  disabled={
                    components
                      ? getFilteredCount(
                          components,
                          value as QuickFilterOption,
                        ) === 0
                      : false
                  }
                  className="flex-1 md:flex-initial relative overflow-hidden rounded-none border border-border py-2 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{getFilterLabel(label)}</span>
                    {components && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {getFilteredCount(
                          components,
                          value as QuickFilterOption,
                        )}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div
          className={cn(
            "flex items-center gap-2",
            hideSearch ? "md:w-auto ml-auto" : "md:w-[450px]",
          )}
        >
          {!hideSearch && (
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {searchQuery ? (
                <button
                  className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                  onClick={handleClearInput}
                  aria-label="Clear search"
                >
                  <CircleX size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              ) : (
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
                  <kbd className="hidden md:inline-flex h-5 max-h-full items-center rounded border border-border px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    ⌘K
                  </kbd>
                </div>
              )}
            </div>
          )}

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger
              className={`${isDesktop ? "w-[180px]" : "w-auto min-w-[40px] px-2"}`}
            >
              {isDesktop ? (
                <SelectValue placeholder="Sort by" />
              ) : (
                <ArrowUpDown className="h-4 w-4" />
              )}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
