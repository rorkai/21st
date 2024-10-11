import React, { useState } from "react"
import { ComponentCard } from "./ComponentCard"
import { Component, User } from "../types/types"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "./Loading"
import { useQuery } from "@tanstack/react-query"
import { createSupabaseClerkClient } from "@/utils/clerk"


interface ComponentsListMainPageProps {
  initialComponents: Component[]
  isLoading?: boolean
}

export function ComponentsListMainPage({ initialComponents, isLoading }: ComponentsListMainPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createSupabaseClerkClient()

  const { data: components } = useQuery({
    queryKey: ['components', searchTerm, initialComponents],
    queryFn: async () => {
      if (!searchTerm) {
        return initialComponents;
      }
      console.log("Fetching components with query:", searchTerm);
      const { data: components, error, status } = await supabase.rpc("search_components", {
        search_query: searchTerm,
      })
      if (error) {
        throw new Error(error.message || `HTTP error: ${status}`);
      }
      return components.map((component: Component & { user_data: User }) => ({
        ...component,
        user: component.user_data as User,
      }))
    },
    initialData: initialComponents,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {!isLoading && (
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[300px] ml-auto"
          />
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10">
        {components.map((component: Component & { user: User }) => (
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
