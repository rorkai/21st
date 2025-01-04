import React from "react"
import { cn } from "@/lib/utils"
import { Component, User } from "../types/global"
import { ComponentCard, ComponentCardSkeleton } from "./ComponentCard"

export function ComponentsList({
  components,
  isLoading,
  className,
  skeletonCount = 12,
}: {
  components?: (Component & { user: User })[] | null
  isLoading?: boolean
  className?: string
  skeletonCount?: number
}) {
  return (
    <div
      className={cn(
        `grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10`,
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
          <ComponentCard key={component.id} component={component} />
        ))
      )}
    </div>
  )
}

export default ComponentsList
