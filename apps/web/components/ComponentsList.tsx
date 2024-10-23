import React from "react"
import { ComponentCard } from "./ComponentCard"
import { Component, User } from "../types/global"
import { cn } from "@/lib/utils"

export function ComponentsList({
  components,
  isLoading,
  className,
}: {
  components?: (Component & { user: User })[] | null
  isLoading?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        `grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10`,
        className,
      )}
    >
      {components?.map((component) => (
        <ComponentCard
          key={component.id}
          component={component}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}

export default ComponentsList
