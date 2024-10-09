import { useState } from "react"
import { useComponentOwnerUsername } from "@/utils/dataFetchers"
import { format } from "date-fns"
import Link from "next/link"
import { UserAvatar } from "@/components/UserAvatar"
import { LoadingSpinner } from "./Loading"
import { Component } from "@/types/types"


export const Info: React.FC<{ info: Component }> = ({ info }) => {
  const [copiedLibDependencies, setCopiedLibDependencies] = useState(false)

  const parseDependencies = (deps: any): Record<string, string> => {
    if (typeof deps === "string") {
      try {
        return JSON.parse(deps)
      } catch (e) {
        console.error("Failed to parse dependencies:", e)
        return {}
      }
    }
    return deps || {}
  }

  const libDependencies = parseDependencies(info.dependencies)

  const componentDependencies = parseDependencies(info.internal_dependencies)

  const dependencyQueries = Object.values(componentDependencies).map((slug) =>
    useComponentOwnerUsername(slug),
  )

  const isLoading = dependencyQueries.some((query) => query.isLoading)
  const isError = dependencyQueries.some((query) => query.isError)

  const componentLinks = Object.fromEntries(
    Object.entries(componentDependencies).map(([key, slug], index) => [
      key,
      dependencyQueries[index]?.data
        ? `/${dependencyQueries[index]?.data}/${slug}`
        : "#",
    ]),
  )

  const copyDependencies = () => {
    const dependenciesString = Object.entries({
      ...libDependencies,
    })
      .map(([dep, version]) => `"${dep}": "${version}"`)
      .join(",\n")
    navigator.clipboard.writeText(`{\n${dependenciesString}\n}`)
    setCopiedLibDependencies(true)
    setTimeout(() => setCopiedLibDependencies(false), 2000)
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      {info.name && (
        <div className="flex items-center">
          <span className="text-gray-500 w-1/3">Name:</span>
          <span className="text-black w-2/3 font-semibold text-right">
            {info.name}
          </span>
        </div>
      )}
      {info.user && (
        <div className="flex items-center">
          <span className="text-gray-500 w-1/3">Created by:</span>
          <div className="flex items-center w-2/3 justify-end font-semibold">
            <Link
              href={`/${info.user.username}`}
              className="flex items-center text-blue-500 hover:underline"
            >
              <UserAvatar
                src={info.user.image_url || "/placeholder.svg"}
                alt={info.user.name || info.user.username}
                size={24}
              />
              <span className="ml-2">
                {info.user.name || info.user.username}
              </span>
            </Link>
          </div>
        </div>
      )}
      {info.description && (
        <div className="flex">
          <span className="text-gray-500 w-1/3">Description:</span>
          <span className="text-black w-2/3 font-semibold text-right">
            {info.description}
          </span>
        </div>
      )}
      {info.created_at && (
        <div className="flex">
          <span className="text-gray-500 w-1/3">Created:</span>
          <span className="text-black w-2/3 font-semibold text-right">
            {format(new Date(info.created_at), "PPP")}
          </span>
        </div>
      )}
      {info.tags && info.tags.length > 0 && (
        <div className="flex">
          <span className="text-gray-500 w-1/3">Tags:</span>
          <div className="w-2/3 flex flex-wrap gap-2 font-semibold justify-end">
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
        <div className="flex">
          <span className="text-gray-500 w-1/3">Lib deps:</span>
          <div className="w-2/3 hover:underline">
            {copiedLibDependencies ? (
              <div className="font-mono text-ellipsis font-semibold text-right">
                Copied!
              </div>
            ) : (
              Object.entries(libDependencies).map(([dep]) => (
                <div
                  key={dep}
                  className="font-mono text-blue-500 cursor-pointer font-semibold text-ellipsis text-right"
                  onClick={copyDependencies}
                >
                  {dep}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {Object.keys(componentDependencies).length > 0 && (
        <div className="flex">
          <span className="text-gray-500 w-1/3">
            Deps to another components
          </span>
          <div className="w-2/3">
            {isLoading ? (
              <LoadingSpinner />
            ) : isError ? (
              <span>Error</span>
            ) : (
              Object.entries(componentDependencies).map(([key, slug]) => (
                <Link
                  key={slug}
                  href={componentLinks[key] || "#"}
                  className="font-mono text-blue-500 hover:underline cursor-pointer font-semibold text-ellipsis text-right block"
                >
                  {slug}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}