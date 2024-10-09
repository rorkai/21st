import { useState, useCallback } from "react"
import { useDependencyComponents } from "@/utils/dataFetchers"
import { format } from "date-fns"
import Link from "next/link"
import { UserAvatar } from "@/components/UserAvatar"
import { LoadingSpinner } from "./Loading"
import { Component } from "@/types/types"
import { ArrowUpRight, Check, Copy } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ComponentsList } from "./ComponentsList"

export const Info: React.FC<{ info: Component }> = ({ info }) => {
  const [copiedLibDependencies, setCopiedLibDependencies] = useState(false)
  const [copiedDependency, setCopiedDependency] = useState<string | null>(null)
  const [isLibDepsHovered, setIsLibDepsHovered] = useState(false)

  const parseDependencies = useCallback((deps: any): Record<string, string> => {
    if (typeof deps === "string") {
      try {
        return JSON.parse(deps)
      } catch (e) {
        console.error("Failed to parse dependencies:", e)
        return {}
      }
    }
    return deps || {}
  }, [])

  const libDependencies = parseDependencies(info.dependencies)
  const componentDependencies = parseDependencies(info.internal_dependencies)

  const { data: dependencyComponents, isLoading: isLoadingDependencies } =
    useDependencyComponents(componentDependencies)
  console.log("dependencyComponents are :", dependencyComponents)

  const copyAllDependencies = () => {
    const dependenciesString = Object.entries({
      ...libDependencies,
    })
      .map(([dep, version]) => `"${dep}": "${version}"`)
      .join(",\n")
    navigator.clipboard.writeText(`{\n${dependenciesString}\n}`)
    setCopiedLibDependencies(true)
    setTimeout(() => setCopiedLibDependencies(false), 2000)
  }

  const copySingleDependency = (dep: string, version: string) => {
    navigator.clipboard.writeText(`"${dep}": "${version}"`)
    setCopiedDependency(dep)
    setTimeout(() => setCopiedDependency(null), 2000)
  }

  return (
    <div className="p-3 space-y-3 text-sm overflow-y-auto max-h-[calc(100vh-100px)]">
      {info.name && (
        <div className="flex items-center">
          <span className="text-gray-500 w-1/3">Name:</span>
          <span className="text-black w-2/3 ">{info.name}</span>
        </div>
      )}
      {info.user && (
        <div className="flex items-center">
          <span className="text-gray-500 w-1/3">Created by:</span>
          <div className="flex items-center justify-start hover:bg-gray-100 rounded-md px-2 py-1 mr-auto">
            <Link href={`/${info.user.username}`} className="flex items-center">
              <UserAvatar
                src={info.user.image_url || "/placeholder.svg"}
                alt={info.user.name || info.user.username}
                size={24}
              />
              <span className="ml-2 font-medium">
                {info.user.name || info.user.username}
              </span>
            </Link>
          </div>
        </div>
      )}
      {info.description && (
        <div className="flex items-start">
          <span className="text-gray-500 w-1/3">Description:</span>
          <span className="text-black w-2/3  ">{info.description}</span>
        </div>
      )}
      {info.created_at && (
        <div className="flex items-center">
          <span className="text-gray-500 w-1/3">Created:</span>
          <span className="text-black w-2/3 text-left ">
            {format(new Date(info.created_at), "PPP")}
          </span>
        </div>
      )}
      {info.tags && info.tags.length > 0 && (
        <div className="flex items-center justify-center">
          <span className="text-gray-500 w-1/3">Tags:</span>
          <div className="w-2/3 flex flex-wrap gap-2 d">
            {info.tags.map((tag) => (
              <span
                key={tag.slug}
                className="bg-gray-200 px-2 py-1 rounded-md text-black"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(libDependencies).length > 0 && (
        <>
          <Separator className="w-full !my-6" />
          <div
            className="flex flex-col"
            onMouseEnter={() => setIsLibDepsHovered(true)}
            onMouseLeave={() => setIsLibDepsHovered(false)}
          >
            <div className="flex items-center mb-2 justify-between">
              <span className="text-gray-500 w-full font-medium">
                NPM dependencies:
              </span>
              <div
                className="relative group cursor-pointer"
                onClick={copyAllDependencies}
              >
                {isLibDepsHovered &&
                  Object.keys(libDependencies).length > 1 && (
                    <span className="whitespace-nowrap">
                      {copiedLibDependencies
                        ? "Copied all!"
                        : "Copy all"}
                    </span>
                  )}
              </div>
            </div>

            <div className="pl-1/3 flex flex-col ">
              {Object.entries(libDependencies).map(([dep, version]) => (
                <div
                  key={dep}
                  className="flex items-center justify-between group hover:bg-gray-100  rounded-md p-1"
                >
                  <a
                    href={`https://www.npmjs.com/package/${dep}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="">{dep}</span>
                  </a>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100  cursor-pointer transition-opacity">
                    <a
                      href={`https://www.npmjs.com/package/${dep}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-gray-200 rounded relative overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative p-1 transition-all duration-300 ease-in-out hover:translate-x-[2px] hover:-translate-y-[2px]">
                        <ArrowUpRight size={16} />
                      </div>
                    </a>
                    <button
                      onClick={() => copySingleDependency(dep, version)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {copiedDependency === dep ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {Object.keys(componentDependencies).length > 0 && (
        <>
          <Separator className="w-full !my-6" />
          <div className="flex flex-col">
            <div className="flex items-center mb-2 justify-between">
              <span className="text-gray-500 w-full font-medium">
                Components used in the demo:
              </span>
            </div>
            <div className="pl-1/3 ">
              {isLoadingDependencies ? (
                <LoadingSpinner />
              ) : dependencyComponents ? (
                <ComponentsList components={dependencyComponents} />
              ) : (
                <span>Error loading dependencies</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
