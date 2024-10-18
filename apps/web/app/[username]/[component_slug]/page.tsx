import ComponentPage from "@/components/ComponentPage"
import React from "react"
import { notFound } from "next/navigation"
import { getComponent, getUserData } from "@/utils/dbQueries"
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
  const { data: user } = await getUserData(supabaseWithAdminAccess, params.username)

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

export default async function ComponentPageLayout({
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
  const demoDependencies = (component.demo_dependencies ?? {}) as Record<string, string>
  const internalDependencies = (component.internal_dependencies ?? {}) as Record<string, string>

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

  const internalDependenciesPromises = Object.entries(
    internalDependencies,
  ).flatMap(([path, slugs]) => {
    const slugArray = Array.isArray(slugs) ? slugs : [slugs]
    return slugArray.map(async (slug) => {
      const fileName = `${slug.split("/").pop()}.tsx`
      const dependencyUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${component.user_id}/${fileName}`
      const response = await fetch(dependencyUrl)
      if (!response.ok) {
        console.error(
          `Error downloading file for ${slug}:`,
          response.statusText,
          dependencyUrl,
        )
        return { data: null, error: new Error(response.statusText) }
      }

      const code = await response.text()
      if (!code) {
        console.error(
          `Error loading internal dependency ${slug}: No code returned`,
        )
        return { data: null, error: new Error("No code returned") }
      }
      const fullPath = path.endsWith(".tsx") ? path : `${path}.tsx`
      return { data: { [fullPath]: code }, error: null }
    })
  })

  const [codeResult, demoResult, ...internalDependenciesResults] =
    await Promise.all([
      ...componentAndDemoCodePromises,
      ...internalDependenciesPromises,
    ])

  if (codeResult?.error || demoResult?.error) {
    return (
      <ErrorPage
        error={
          new Error(
            codeResult?.error?.message ?? demoResult?.error?.message,
          )
        }
      />
    )
  }
  const errorResult = internalDependenciesResults?.find(
    (result) => result?.error,
  )
  if (errorResult) {
    const errorMessage = errorResult.error?.message ?? "Unknown error"
    return (
      <ErrorPage
        error={
          new Error(`Error fetching internal dependencies: ${errorMessage}`)
        }
      />
    )
  }

  const internalDependenciesWithCode = internalDependenciesResults
    .filter((result) => result?.data && typeof result.data === "object")
    .reduce((acc, result) => ({ ...acc, ...(result.data as Record<string, string>) }), {})

  const code = codeResult?.data as string
  const rawDemoCode = demoResult?.data as string

  return (
    <div className="w-full ">
      <ComponentPage
        component={component}
        code={code}
        demoCode={rawDemoCode}
        dependencies={dependencies}
        demoDependencies={demoDependencies}
        demoComponentNames={component.demo_component_names as string[]}
        internalDependencies={internalDependenciesWithCode}
      />
    </div>
  )
}
