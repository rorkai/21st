
import ComponentPage from "@/components/ComponentPage"
import React from "react"
import { notFound } from "next/navigation"
import { getComponent } from "@/utils/dataFetchers"
import { supabaseWithAdminAccess } from "@/utils/supabase"

export const generateMetadata = async ({
  params,
}: {
  params: { username: string; component_slug: string }
  }) => {
  const { data: component } = await getComponent(
    supabaseWithAdminAccess,
    params.username,
    params.component_slug,
  )
  return {
    title: component ? `${component.name} | Component` : "Component Not Found",
  }
}

export default async function ComponentPageLayout({
  params,
}: {
  params: { username: string; component_slug: string }
  }) {
  const { username, component_slug } = params


  const { data: component, error } = await getComponent(supabaseWithAdminAccess, username, component_slug)
  
  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (!component) {
    notFound()
  }

  return (
      <div className="w-full ">
        <ComponentPage component={component} />
      </div>
  )
}
