"use client"

import React from "react"
import { ComponentCard } from "./ComponentCard"
import { Component, User } from "../types/global"
import { useComponents, useTagInfo } from "@/utils/dbQueries"
import { Header } from "./Header"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { cn } from "@/lib/utils"

export function ComponentsList({
  initialComponents,
  isLoading,
  tagSlug,
}: {
  initialComponents?: (Component & { user: User })[] | null
  isLoading?: boolean
  tagSlug?: string
}) {
  const supabase = useClerkSupabaseClient()
  const { data: fetchedComponents } = useComponents(supabase, tagSlug)
  const { data: tagInfo } = useTagInfo(supabase, tagSlug)
  const components = initialComponents ?? fetchedComponents
  return (
    <div>
      {tagSlug && <Header tagName={tagInfo?.name} page="components" />}
      <div
        className={cn(
          `grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10`,
          tagSlug ? "mt-20" : "",
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
    </div>
  )
}
