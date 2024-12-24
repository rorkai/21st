import { useAtom, Atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SortOption } from "@/types/global"
import NumberFlow from "@number-flow/react"
import { Input } from "@/components/ui/input"
import { useMediaQuery } from "@/hooks/use-media-query"
import { searchQueryAtom } from "@/components/Header"
import { useEffect, useRef } from "react"
import { ArrowUpDown, CircleX } from "lucide-react"

const sortByAtom: Atom<SortOption> = atomWithStorage(
  "components-sort-by",
  "newest",
)

const sortOptions = {
  installations: "Most downloaded",
  popular: "Most liked",
  newest: "Newest",
} as const

interface ComponentsHeaderProps {
  totalCount: number
}

export function ComponentsHeader({ totalCount }: ComponentsHeaderProps) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

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

  const handleClearInput = () => {
    setSearchQuery("")
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
      <div className="hidden md:flex text-sm text-muted-foreground items-center gap-1">
        <NumberFlow value={totalCount} className="tabular-nums" />
        <span>{totalCount === 1 ? "component" : "components"}</span>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:flex-initial">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-[200px] pe-9"
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

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className={`${isDesktop ? 'w-[180px]' : 'w-auto px-2'}`}>
            {isDesktop ? (
              <SelectValue placeholder="Sort by" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortOptions).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export { sortByAtom }
