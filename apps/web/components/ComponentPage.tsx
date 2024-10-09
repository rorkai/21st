/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "./ui/button"
import { LayoutTemplate, CodeXml, Link, Tag } from "lucide-react"
import { LoadingSpinner } from "./Loading"
import { Component } from "@/types/types"
import { UserAvatar } from "./UserAvatar"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { generateFiles } from "@/utils/generateFiles"

const ComponentPreview = dynamic(() => import("./ComponentPreview"), {
  ssr: false,
  loading: () => null,
})

export default function ComponentPage({
  component,
}: {
  component: Component
}) {
  const supabase = useClerkSupabaseClient()
  const [isLoading, setIsLoading] = useState(true)
  const [showLoading, setShowLoading] = useState(false)
  const [code, setCode] = useState("")
  const [demoCode, setDemoCode] = useState("")
  const [dependencies, setDependencies] = useState<Record<string, string>>({})
  const [demoDependencies, setDemoDependencies] = useState<
    Record<string, string>
  >({})
  const [internalDependenciesCode, setInternalDependenciesCode] = useState<
    Record<string, string>
  >({})
  const [isSharing, setIsSharing] = useState(false)
  const [shareButtonText, setShareButtonText] = useState("Share")

  useEffect(() => {
    async function fetchCode() {
      const loadingTimeout = setTimeout(() => setShowLoading(true), 300)
      setIsLoading(true)
      try {
        const { data: codeData, error: codeError } = await supabase.storage
          .from("components")
          .download(`${component.component_slug}-code.tsx`)

        const { data: demoData, error: demoError } = await supabase.storage
          .from("components")
          .download(`${component.component_slug}-demo.tsx`)

        if (codeError || demoError) {
          console.error("Error fetching code:", codeError || demoError)
          return
        }

        const codeText = await codeData.text()
        const rawDemoCode = await demoData.text()

        setCode(codeText)
        const componentNames = parseComponentNames(component.component_name)
        const updatedDemoCode = `import { ${componentNames.join(", ")} } from "./${component.component_slug}";\n${rawDemoCode}`
        setDemoCode(updatedDemoCode)

        const componentDependencies = JSON.parse(component.dependencies || "{}")
        const componentDemoDependencies = JSON.parse(
          component.demo_dependencies || "{}",
        )
        const componentInternalDependencies = JSON.parse(
          component.internal_dependencies || "{}",
        )
        setDependencies(componentDependencies)
        setDemoDependencies(componentDemoDependencies)

        await fetchInternalDependencies(componentInternalDependencies)
      } catch (error) {
        console.error("Error in fetchCode:", error)
      } finally {
        clearTimeout(loadingTimeout)
        setIsLoading(false)
        setShowLoading(false)
      }
    }

    fetchCode()
  }, [component])

  async function fetchInternalDependencies(
    componentInternalDependencies: Record<string, string | string[]>,
  ) {
    const internalDepsCode: Record<string, string> = {}
    for (const [path, slugs] of Object.entries(componentInternalDependencies)) {
      if (typeof slugs === "string") {
        await fetchSingleDependency(path, slugs, internalDepsCode)
      } else if (Array.isArray(slugs)) {
        for (const slug of slugs) {
          await fetchSingleDependency(path, slug, internalDepsCode)
        }
      }
    }
    setInternalDependenciesCode(internalDepsCode)
  }

  async function fetchSingleDependency(
    path: string,
    slug: string,
    internalDepsCode: Record<string, string>,
  ) {
    try {
      const { data, error } = await supabase.storage
        .from("components")
        .download(`${slug}-code.tsx`)

      if (error) {
        console.error(`Error loading internal dependency ${slug}:`, error)
        return
      }

      const dependencyCode = await data.text()
      const fullPath = path.endsWith(".tsx") ? path : `${path}.tsx`
      internalDepsCode[fullPath] = dependencyCode
    } catch (error) {
      console.error(`Error fetching dependency ${slug}:`, error)
    }
  }

  const demoComponentName = component.demo_component_name

  const files = generateFiles({
    demoComponentName,
    componentSlug: component.component_slug,
    code,
    demoCode,
  })

  const handleShareClick = async () => {
    setIsSharing(true)
    const url = `${window.location.origin}/${component.user.username}/${component.component_slug}`
    try {
      await navigator.clipboard.writeText(url)
      setShareButtonText("Copied")
      setTimeout(() => setShareButtonText("Share"), 2000)
    } catch (err) {
      console.error("Error copying link: ", err)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg p-4 bg-slate-50 h-[90vh] w-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <a href={`/${component.user.username}`}>
            <UserAvatar
              src={component.user.image_url || "/placeholder.svg"}
              alt={component.user.name}
              size={32}
            />
          </a>
          <div className="h-10 w-[1px] bg-gray-200" />
          <div className="flex gap-2 items-start">
            <p className="text-[17px] font-semibold">{component.name}</p>
            <p className="text-[17px] text-gray-600">{component.description}</p>
            {component.tags && component.tags.length > 0 && (
              <div className="flex gap-2 ml-2">
                {component.tags.map((tag) => (
                  <div
                    key={tag.slug}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
                  >
                    <Tag size={12} />
                    {tag.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleShareClick}
            disabled={isSharing}
          >
            {shareButtonText}
            <div className="ml-2 w-5 h-5 flex items-center justify-center">
              <Link size={20} />
            </div>
          </Button>
        </div>
      </div>
      {isLoading && showLoading && <LoadingSpinner />}
      {!isLoading && (
        <div className="flex w-full !flex-grow">
          <ComponentPreview
            files={files}
            dependencies={dependencies}
            demoDependencies={demoDependencies}
            demoComponentName={demoComponentName}
            internalDependencies={internalDependenciesCode}
            installUrl={component.install_url}
            componentSlug={component.component_slug}
            componentInfo={component}
          />
        </div>
      )}
    </div>
  )
}

function parseComponentNames(componentName: string): string[] {
  try {
    return JSON.parse(componentName)
  } catch {
    return [componentName]
  }
}
