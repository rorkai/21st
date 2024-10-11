import ComponentPage from "@/components/ComponentPage"
import React from "react"
import { notFound } from "next/navigation"
import { getComponent } from "@/utils/dataFetchers"
import { supabaseWithAdminAccess } from "@/utils/supabase"
import { generateFiles } from "@/utils/generateFiles"

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
  const apiUrl = process.env.NEXT_PUBLIC_CDN_URL
  const { data: component, error } = await getComponent(
    supabaseWithAdminAccess,
    username,
    component_slug,
  )

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (!component) {
    notFound()
  }

  const dependencies = JSON.parse(component.dependencies || "{}")
  const demoDependencies = JSON.parse(component.demo_dependencies || "{}")
  const internalDependencies = JSON.parse(
    component.internal_dependencies || "{}",
  )

  const componentAndDemoCodePromises = [
    fetch(component.code).then(async (response) => {
      if (!response.ok) {
        console.error(`Error loading component code:`, response.statusText)
        return { data: null, error: new Error(response.statusText) }
      }
      const code = await response.text()
      return { data: code, error: null }
    }),
    fetch(component.demo_code).then(async (response) => {
      if (!response.ok) {
        console.error(`Error loading component demo code:`, response.statusText)
        return { data: null, error: new Error(response.statusText) }
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
      const dependencyUrl = `${apiUrl}/${slug}-code.tsx`
      const response = await fetch(dependencyUrl)
      if (!response.ok) {
        console.error(
          `Error downloading file for ${slug}:`,
          response.statusText,
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
    return <div>Error fetching component code</div>
  }

  if (internalDependenciesResults?.find((result) => result?.error)) {
    return <div>Error fetching internal dependencies</div>
  }

  const internalDependenciesWithCode = internalDependenciesResults
    .filter((result) => typeof result?.data === "object")
    .reduce(
      (acc, result): Record<string, string> => {
        if (result?.data && typeof result.data === "object") {
          return { ...acc, ...result.data }
        }
        return acc
      },
      {} as Record<string, string>,
    )

  const code = codeResult?.data as string
  const rawDemoCode = demoResult?.data as string

  const componentNames = JSON.parse(component.component_name)
  const demoCode = `import { ${componentNames.join(", ")} } from "./${component.component_slug}";\n\n${rawDemoCode}`

  const demoComponentName = component.demo_component_name

  const files = generateFiles({
    demoComponentName,
    componentSlug: component.component_slug,
    code,
    demoCode,
  })

  return (
    <div className="w-full ">
      <ComponentPage
        component={component}
        files={files}
        dependencies={dependencies}
        demoDependencies={demoDependencies}
        demoComponentName={demoComponentName}
        internalDependencies={internalDependenciesWithCode}
      />
    </div>
  )
}
