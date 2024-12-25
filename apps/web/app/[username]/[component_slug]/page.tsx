import ComponentPage from "@/components/ComponentPage"
import React from "react"
import { notFound } from "next/navigation"
import { getComponent, getUserData } from "@/lib/queries"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import ErrorPage from "@/components/ErrorPage"
import { extractDemoComponentNames } from "@/lib/parsers"

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": component.name,
    "description": component.description,
    "programmingLanguage": {
      "@type": "ComputerLanguage",
      "name": "React"
    },
    "author": {
      "@type": "Person",
      "name": user.username
    },
    "dateCreated": component.created_at,
    "license": component.license
  }

  return {
    title: `${component.name} | The NPM for Design Engineers | 21st.dev`,
    description: component.description || `A React component by ${user.username}. Built for design engineers using Tailwind CSS and shadcn/ui.`,
    keywords: [
      'react components', 
      'design engineers',
      'tailwind css', 
      'ui components', 
      'shadcn/ui', 
      'component library',
      `${component.name.toLowerCase()} component`,
      `${component.name.toLowerCase()} shadcn/ui`,
      ...(component.tags?.map(tag => tag.name.toLowerCase()) || [])
    ],
    openGraph: {
      title: `${component.name} - The NPM for Design Engineers`,
      description: component.description || `A React component by ${user.username}. Ship polished UI faster with ready-to-use components.`,
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
      title: `${component.name} - The NPM for Design Engineers`,
      description: component.description || `A React component by ${user.username}. Ship polished UI faster with ready-to-use components.`,
      images: [ogImageUrl],
    },
    other: {
      "script:ld+json": JSON.stringify(structuredData)
    }
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
    component.tailwind_config_extension ? fetch(component.tailwind_config_extension).then(async (response) => {
      if (!response.ok) {
        console.error(`Error fetching component tailwind config:`, response.statusText)
        return {
          data: null,
          error: new Error(`Error fetching component tailwind config: ${response.statusText}`),
        }
      }
      const tailwindConfig = await response.text()
      return { data: tailwindConfig, error: null }
    }) : Promise.resolve({ data: null, error: null }),
    component.global_css_extension ? fetch(component.global_css_extension).then(async (response) => {
      if (!response.ok) {
        console.error(`Error fetching component global css:`, response.statusText)
        return {
          data: null,
          error: new Error(`Error fetching component global css: ${response.statusText}`),
        }
      }
      const globalCss = await response.text()
      return { data: globalCss, error: null }
    }) : Promise.resolve({ data: null, error: null }),
    component.compiled_css ? fetch(component.compiled_css).then(async (response) => {
      if (!response.ok) {
        console.error(`Error fetching component css:`, response.statusText)
        return {
          data: null,
          error: new Error(`Error fetching component css: ${response.statusText}`),
        }
      }
      const componentCss = await response.text()
      return { data: componentCss, error: null }
    }) : Promise.resolve({ data: null, error: null }),
  ]

  const [codeResult, demoResult, tailwindConfigResult, globalCssResult, compiledCssResult, registryDependenciesResult] =
    await Promise.all([
      ...componentAndDemoCodePromises,
      resolveRegistryDependencyTree({
        supabase: supabaseWithAdminAccess,
        sourceDependencySlugs: [`${username}/${component_slug}`],
        withDemoDependencies: true,
      }),
    ])

  if (codeResult?.error || demoResult?.error || tailwindConfigResult?.error || globalCssResult?.error || compiledCssResult?.error) {
    return (
      <ErrorPage
        error={
          codeResult?.error ?? demoResult?.error ?? tailwindConfigResult?.error ?? globalCssResult?.error ?? compiledCssResult?.error ?? new Error("Unknown error")
        }
      />
    )
  }
  if (registryDependenciesResult?.error) {
    return (
      <ErrorPage
        error={registryDependenciesResult.error ?? new Error("Unknown error")}
      />
    )
  }

  const registryDependenciesData = registryDependenciesResult?.data as {
    filesWithRegistry: Record<string, { code: string; registry: string }>
    npmDependencies: Record<string, string>
  }

  const registryDependenciesFiles = Object.fromEntries(
    Object.entries(registryDependenciesData.filesWithRegistry).map(
      ([key, value]) => [key, value.code],
    ),
  )
  const demoComponentNames = extractDemoComponentNames(
    demoResult?.data as string,
  )

  return (
    <div className="w-full ">
      <ComponentPage
        component={component}
        code={codeResult?.data as string}
        demoCode={demoResult?.data as string}
        dependencies={dependencies}
        demoDependencies={demoDependencies}
        demoComponentNames={demoComponentNames}
        registryDependencies={registryDependenciesFiles}
        npmDependenciesOfRegistryDependencies={
          registryDependenciesData.npmDependencies
        }
        tailwindConfig={tailwindConfigResult?.data as string}
        globalCss={globalCssResult?.data as string}
        compiledCss={compiledCssResult?.data as string}
      />
    </div>
  )
}
