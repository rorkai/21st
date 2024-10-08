
import ComponentPreview from "@/components/ComponentPreview"
import { Header } from "@/components/Header"
import React from "react"
import { notFound } from "next/navigation"
import { getComponent } from "@/utils/dataFetchers"
import { createSupabaseClerkClient } from "@/utils/clerk"
import { supabaseWithAdminAccess } from "@/utils/supabase"
import { auth } from "@clerk/nextjs/server"

export const generateMetadata = async ({
  params,
}: {
  params: { username: string; component_slug: string }
  }) => {
  const component = await getComponent(
    supabaseWithAdminAccess,
    params.username,
    params.component_slug,
  )
  return {
    title: component ? `${component.name} | Component` : "Component Not Found",
  }
}

export default async function ComponentPage({
  params,
}: {
  params: { username: string; component_slug: string }
  }) {
  const { getToken } = auth()
  const { username, component_slug } = params
  const supabase = createSupabaseClerkClient(getToken)

  console.log("ComponentPage called with params:", params)

  const component = await getComponent(supabase, username, component_slug)

  if (!component) {
    console.log("Component not found, redirecting to 404")
    notFound()
  }

  return (
    <>
      <Header
        componentSlug={component.component_slug}
        isPublic={component.is_public}
      />
      <div className="w-full ">
        <ComponentPreview supabase={supabase} component={component} />
      </div>
    </>
  )
}
