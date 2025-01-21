import React from "react"
import { cn } from "@/lib/utils"
import {
  ComponentCard,
  ComponentCardSkeleton,
} from "../features/list-card/card"
import { DemoWithComponent, User, Component } from "@/types/global"

type ComponentOrDemo = DemoWithComponent | (Component & { user: User } & { view_count?: number })

export function ComponentsList({
  components,
  isLoading,
  className,
  skeletonCount = 12,
}: {
  components?: ComponentOrDemo[] | null
  isLoading?: boolean
  className?: string
  skeletonCount?: number
}) {
  return (
    <div
      className={cn(
        `grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-9 list-none pb-10`,
        className,
      )}
    >
      {isLoading ? (
        <>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <ComponentCardSkeleton key={i} />
          ))}
        </>
      ) : (
        components?.map((component) => (
          <ComponentCard
            key={`${component.id}-${component.updated_at}`}
            component={component}
          />
        ))
      )}
    </div>
  )
}

export default ComponentsList
