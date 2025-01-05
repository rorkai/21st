import { useEffect, useRef } from "react"
import { useAtom } from "jotai"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ArrowUpDown, CircleX } from "lucide-react"

import { cn } from "@/lib/utils"
import { filterComponents } from "@/lib/filters.client"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { searchQueryAtom } from "@/components/Header"
import { sortByAtom, quickFilterAtom } from "@/components/ComponentsHeader"

import type {
  SortOption,
  QuickFilterOption,
  Component,
  User,
} from "@/types/global"
import { QUICK_FILTER_OPTIONS, SORT_OPTIONS } from "@/types/global"

const getFilteredCount = (
  components: (Component & { user: User })[],
  filter: QuickFilterOption,
) => {
  if (!components) return 0
  return filterComponents(components, filter).length
}

interface TagComponentsHeaderProps {
  filtersDisabled: boolean
  components?: (Component & { user: User })[]
  currentSection?: string
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

export function TagComponentsHeader({
  filtersDisabled,
  components,
  currentSection,
}: TagComponentsHeaderProps) {
  const [quickFilter, setQuickFilter] = useAtom(quickFilterAtom)
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isMobile = useMediaQuery("(max-width: 768px)")

  useSearchHotkeys(inputRef)

  const getFilterLabel = (label: string) => {
    if (isMobile && label === "All Components") {
      return "All"
    }
    return label
  }

  const getSearchPlaceholder = () => {
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1200px)")

    if (isTablet) {
      return "Search..."
    }

    if (currentSection) {
      return `Search ${currentSection.toLowerCase()}...`
    }
    return "Search components..."
  }

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
            <TabsList className="w-full md:w-auto h-8 -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
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
                  className="flex-1 md:flex-initial relative overflow-hidden rounded-none border border-border h-8 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{getFilterLabel(label)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {components
                        ? getFilteredCount(
                            components,
                            value as QuickFilterOption,
                          )
                        : 0}
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
                onClick={() => {
                  setSearchQuery("")
                  inputRef.current?.focus()
                }}
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

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger
              className={`h-8 ${isDesktop ? "w-[180px]" : "w-auto min-w-[40px] px-2"}`}
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
