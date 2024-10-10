/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ChevronRight, Check, CodeXml, Info, Link as LinkIcon } from "lucide-react"
import { LoadingSpinner } from "./Loading"
import { Component } from "@/types/types"
import { UserAvatar } from "./UserAvatar"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { generateFiles } from "@/utils/generateFiles"
import { atom, useAtom } from "jotai"
import Image from "next/image"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Hotkey } from "./ui/hotkey"

export const isShowCodeAtom = atom(true)

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
  const [isShared, setIsShared] = useState(false)
  const [isShowCode, setIsShowCode] = useAtom(isShowCodeAtom)

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
    const url = `${window.location.origin}/${component.user.username}/${component.component_slug}`
    try {
      await navigator.clipboard.writeText(url)
      setIsShared(true)
      setTimeout(() => {
        setIsShared(false)
      }, 2000)
    } catch (err) {
      console.error("Error copying link: ", err)
    }
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "BracketRight") {
        e.preventDefault()
        setIsShowCode(false)
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [])

    useEffect(() => {
      const keyDownHandler = (e: KeyboardEvent) => {
        if (e.code === "BracketLeft") {
          e.preventDefault()
          setIsShowCode(true)
        }
      }

      window.addEventListener("keydown", keyDownHandler)

      return () => {
        window.removeEventListener("keydown", keyDownHandler)
      }
    }, [])
  
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "C" && (e.shiftKey )  && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleShareClick()
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [])

  return (
    <div className="flex flex-col gap-2 rounded-lg p-4 h-[98vh] w-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <Link
            href="/"
            className="flex min-w-[20px] min-h-[20px] items-center cursor-pointer"
          >
            <Image
              src="/cc-logo-circle.svg"
              alt="Logo"
              width={20}
              height={20}
              sizes="(min-height: 20px) 100vw, (min-width: 20px) 100vw, 100vh"
            />
          </Link>
          <ChevronRight size={12} className="text-gray-500" />
          <a
            href={`/${component.user.username}`}
            className="cursor-pointer flex items-center whitespace-nowrap"
          >
            <UserAvatar
              src={component.user.image_url || "/placeholder.svg"}
              alt={component.user.name}
              size={20}
              isClickable={true}
            />
          </a>
          <ChevronRight size={12} className="text-gray-500" />
          <div className="flex gap-2 items-start">
            <p className="text-[14px] font-medium whitespace-nowrap">
              {component.name}
            </p>
            <p className="text-[14px] text-gray-600 truncate max-w-[50vw]">
              {component.description}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleShareClick}
                disabled={isShared}
                className="h-8 w-8 flex items-center justify-center mr-1 hover:bg-gray-100 rounded-md relative"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {isShared ? <Check size={18} /> : <LinkIcon size={18} />}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isShared ? "Link copied" : "Copy link"}
                <Hotkey keys={["⌘", "⇧", "C"]} isDarkBackground={true} />
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="relative bg-gray-200 rounded-lg h-8 p-0.5 flex">
            <div
              className="absolute inset-y-0.5 rounded-md bg-white shadow transition-all duration-200 ease-in-out"
              style={{
                width: "calc(50% - 2px)",
                left: isShowCode ? "2px" : "calc(50%)",
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsShowCode(true)}
                  className={`relative z-2 px-2 flex items-center justify-center transition-colors duration-200 ${
                    isShowCode ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  <CodeXml size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Component code
                  <Hotkey keys={["["]} isDarkBackground={true} />
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsShowCode(false)}
                  className={`relative z-2s px-2 flex items-center justify-center transition-colors duration-200 ${
                    !isShowCode ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  <Info size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Component info
                  <Hotkey keys={["]"]} isDarkBackground={true} />
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
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
