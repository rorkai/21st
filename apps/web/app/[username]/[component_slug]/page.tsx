import ComponentPage from "@/components/ComponentPage"
import React from "react"
import { notFound } from "next/navigation"
import {
  getComponent,
  getUserData,
  resolveRegistryDependencyTree,
} from "@/utils/dbQueries"
import { supabaseWithAdminAccess } from "@/utils/supabase"
import ErrorPage from "@/components/ErrorPage"

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
  const { data: user } = await getUserData(
    supabaseWithAdminAccess,
    params.username,
  )

  if (!component || !user) {
    return {
      title: "Component Not Found",
    }
  }

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username}/${component.component_slug}/opengraph-image`

  return {
    title: `${component.name} | Component`,
    description: component.description || `A component by ${user.username}`,
    openGraph: {
      title: `${component.name} by ${user.username}`,
      description: component.description || `A component by ${user.username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Preview of ${component.name} component`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${component.name} by ${user.username}`,
      description: component.description || `A component by ${user.username}`,
      images: [ogImageUrl],
    },
  }
}

export default async function ComponentPageServer({
  params,
}: {
  params: { username: string; component_slug: string }
}) {
  const { username, component_slug } = params
  const { data: component, error } = await getComponent(
    supabaseWithAdminAccess,
    username,
    component_slug,
  )

  if (error) {
    return <ErrorPage error={error} />
  }

  if (!component) {
    notFound()
  }

  const dependencies = (component.dependencies ?? {}) as Record<string, string>
  const demoDependencies = (component.demo_dependencies ?? {}) as Record<
    string,
    string
  >
  const directRegistryDependencies =
    component.direct_registry_dependencies as string[]

  const componentAndDemoCodePromises = [
    fetch(component.code).then(async (response) => {
      if (!response.ok) {
        console.error(`Error fetching component code:`, response.statusText)
        return {
          data: null,
          error: new Error(
            `Error fetching component code: ${response.statusText}`,
          ),
        }
      }
      const code = await response.text()
      return { data: code, error: null }
    }),
    fetch(component.demo_code).then(async (response) => {
      if (!response.ok) {
        console.error(`Error loading component demo code:`, response.statusText)
        return {
          data: null,
          error: new Error(
            `Error loading component demo code: ${response.statusText}`,
          ),
        }
      }
      const demoCode = await response.text()
      return { data: demoCode, error: null }
    }),
  ]

  const [codeResult, demoResult, registryDependenciesResult] =
    await Promise.all([
      ...componentAndDemoCodePromises,
      resolveRegistryDependencyTree(
        supabaseWithAdminAccess,
        directRegistryDependencies,
      ),
    ])

  if (codeResult?.error || demoResult?.error) {
    return (
      <ErrorPage
        error={codeResult?.error ?? demoResult?.error ?? new Error("Unknown error")}
      />
    )
  }
  if (registryDependenciesResult?.error) {
    return (
      <ErrorPage
        error={
          registryDependenciesResult.error ?? new Error("Unknown error")
        }
      />
    )
  }

  return (
    <div className="w-full ">
      <ComponentPage
        component={component}
        code={codeResult?.data as string}
        demoCode={demoResult?.data as string}
        dependencies={dependencies}
        demoDependencies={demoDependencies}
        demoComponentNames={component.demo_component_names as string[]}
        registryDependencies={
          registryDependenciesResult?.data as Record<string, string>
        }
      />
    </div>
  )
}
