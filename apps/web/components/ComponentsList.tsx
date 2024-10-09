
import React from "react"
import { ComponentCard } from "./ComponentCard"
import { Component } from "../types/types"
import { useComponents } from "@/utils/dataFetchers"

interface ComponentsListProps {
  initialComponents: Component[]
}

export function ComponentsList({ initialComponents }: ComponentsListProps) {
  const { data: components } = useComponents()

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
      {(components || initialComponents).map((component) => (
        <ComponentCard key={component.id} component={component} />
      ))}
    </div>
  )
}
