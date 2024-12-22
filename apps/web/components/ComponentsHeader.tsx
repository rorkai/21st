import { useAtom, Atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SortOption } from "@/types/global"
import NumberFlow from "@number-flow/react"

const sortByAtom: Atom<SortOption> = atomWithStorage(
  'components-sort-by', 
  'installations'
)

interface ComponentsHeaderProps {
  totalCount: number
}

export function ComponentsHeader({ totalCount }: ComponentsHeaderProps) {
  const [sortBy, setSortBy] = useAtom(sortByAtom)

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <NumberFlow 
          value={totalCount}
          className="tabular-nums"
        />
        <span>{totalCount === 1 ? 'component' : 'components'}</span>
      </div>
      
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="installations">Downloads</SelectItem>
          <SelectItem value="popular">Popular</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export { sortByAtom }