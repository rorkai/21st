"use client"
import React, { useEffect } from "react"
import { ComponentCard } from "./ComponentCard"
import { Component } from "../types/types"
import { useComponents } from "@/utils/dataFetchers"

interface ComponentsListProps {
  initialComponents: Component[]
}

export function ComponentsList({ initialComponents }: ComponentsListProps) {
  const { data: components, refetch } = useComponents()

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 60000)

    return () => clearInterval(interval)
  }, [refetch])

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
      {(components || initialComponents).map((component) => (
        <ComponentCard key={component.id} component={component} />
      ))}
    </div>
  )
}
