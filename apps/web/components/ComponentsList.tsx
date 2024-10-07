import React from "react"
import { ComponentCard } from "./ComponentCard"
import { Component } from "../types/types"

interface ComponentsListProps {
  components: Component[]
}

export function ComponentsList({ components }: ComponentsListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
      {components.map((component) => (
        <ComponentCard key={component.id} component={component} />
      ))}
    </div>
  )
}
