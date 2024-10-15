"use client"

import React from "react"
import { ComponentCard } from "./ComponentCard"
import { Component } from "../types/types"
import { useComponents, useTagInfo } from "@/utils/dataFetchers"
import { Header } from "./Header"
import { useClerkSupabaseClient } from "@/utils/clerk"

interface ComponentsListProps {
  components?: Component[]
  isLoading?: boolean
  tagSlug?: string
}

export function ComponentsList({
  components: propsComponents,
  isLoading,
  tagSlug,
}: ComponentsListProps) {
  const supabase = useClerkSupabaseClient()
  const { data: fetchedComponents } = useComponents(tagSlug)
  const { data: tagInfo } = useTagInfo(supabase, tagSlug || '')
  const components = propsComponents || fetchedComponents
  return (
    <div>
      {tagSlug && <Header tagName={tagInfo?.name} page="components" />}
      <div
        className={`grid ${tagSlug ? "mt-20" : ""} grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10`}
      >
        {components?.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}
