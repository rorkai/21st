import { useState } from "react"
import Link from "next/link"
import { UserAvatar } from "@/components/UserAvatar"
import { LoadingSpinner } from "./LoadingSpinner"
import { Component, Tag, User } from "@/types/global"
import { ArrowUpRight, Check, Copy, Scale } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ComponentsList } from "./ComponentsList"
import { getLicenseBySlug } from "@/utils/licenses"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { Tag as TagComponent } from "@/components/ui/tag"
import { Badge } from "@/components/ui/badge"

export const ComponentPageInfo = ({
  component,
}: {
  component: Component & { user: User } & { tags: Tag[] }
}) => {
  const supabase = useClerkSupabaseClient()
  const [copiedLibDependencies, setCopiedLibDependencies] = useState(false)
  const [copiedDependency, setCopiedDependency] = useState<string | null>(null)
  const [isLibDepsHovered, setIsLibDepsHovered] = useState(false)

  const npmDependencies = (component.dependencies ?? {}) as Record<
    string,
    string
  >
  const directRegistryDependencies =
    component.direct_registry_dependencies as string[]

  const { data: dependencyComponents, isLoading: isLoadingDependencies } =
    useQuery({
      queryKey: [
        "directRegistryDependenciesComponents",
        directRegistryDependencies,
      ],
      queryFn: async () => {
        // Using a view here because PostgREST has issues with `or(and(...))` on joined tables
        // See: https://github.com/PostgREST/postgrest/issues/2563
        const { data, error } = await supabase
          .from("components_with_username")
          .select("*")
          .or(
            directRegistryDependencies
              .map((d) => {
                const [username, slug] = d.split("/")
                return `and(username.eq."${username}",component_slug.eq."${slug}")`
              })
              .join(","),
          )
          .returns<(Component & { user: User })[]>()

        if (error) {
          console.error("Error fetching dependency component:", error)
          throw error
        }

        return data
      },
      enabled: directRegistryDependencies.length > 0,
      staleTime: Infinity,
    })

  const copyAllDependencies = () => {
    const dependenciesString = Object.entries({
      ...npmDependencies,
    })
      .map(([dep, version]) => `"${dep}": "${version}"`)
      .join(",\n")
    navigator.clipboard.writeText(`{\n${dependenciesString}\n}`)
    setCopiedLibDependencies(true)
    toast("Dependencies copied to clipboard")
    setTimeout(() => setCopiedLibDependencies(false), 2000)
  }

  const copySingleDependency = (dep: string, version: string) => {
    navigator.clipboard.writeText(`"${dep}": "${version}"`)
    setCopiedDependency(dep)
    toast("Dependency copied to clipboard")
    setTimeout(() => setCopiedDependency(null), 2000)
  }

  const license = component.license ? getLicenseBySlug(component.license) : null

  return (
    <div className="p-3 space-y-3 text-sm overflow-y-auto max-h-[calc(100vh-100px)] bg-background text-foreground">
      {component.name && (
        <div className="flex items-center">
          <span className="text-muted-foreground w-1/3">Name:</span>
          <span className="w-2/3">{component.name}</span>
        </div>
      )}
      {component.user && (
        <div className="flex items-center">
          <span className="text-muted-foreground w-1/3">Created by:</span>
          <div className="flex items-center justify-start hover:bg-accent rounded-md px-2 py-1 -mx-2 mr-auto">
            <Link
              href={`/${component.user.username}`}
              className="flex items-center"
            >
              <UserAvatar
                src={component.user.image_url || "/placeholder.svg"}
                alt={component.user.name || component.user.username}
                size={20}
                isClickable={true}
              />
              <span className="ml-1 font-medium">
                {component.user.name || component.user.username}
              </span>
            </Link>
          </div>
        </div>
      )}
      {component.description && (
        <div className="flex items-start">
          <span className="text-muted-foreground w-1/3">Description:</span>
          <span className="w-2/3">{component.description}</span>
        </div>
      )}
      {component.registry && (
        <div className="flex items-start">
          <span className="text-muted-foreground w-1/3">Registry:</span>
          <span className="w-2/3">
            <Badge variant="outline">{component.registry}</Badge>
          </span>
        </div>
      )}
      {license && (
        <div className="flex items-center">
          <span className="text-muted-foreground w-1/3">License:</span>
          <span className="w-2/3 text-left">
            <HoverCard>
              <HoverCardTrigger className="cursor-help">
                {license.label}
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center">
                    <Scale size={18} className="mt-[2px]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium">{license.label}</h4>
                    <p className="text-[12px] mt-1">{license.description}</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </span>
        </div>
      )}
      {component.tags && component.tags.length > 0 && (
        <div className="flex items-start">
          <span className="text-muted-foreground w-1/3 mt-1">Tags:</span>
          <div className="w-2/3 flex flex-wrap gap-2">
            {component.tags.map((tag) => (
              <TagComponent key={tag.slug} slug={tag.slug} name={tag.name} />
            ))}
          </div>
        </div>
      )}

      {Object.keys(npmDependencies).length > 0 && (
        <>
          <Separator className="w-full !my-6" />
          <div
            className="flex flex-col"
            onMouseEnter={() => setIsLibDepsHovered(true)}
            onMouseLeave={() => setIsLibDepsHovered(false)}
          >
            <div className="flex items-center mb-2 justify-between">
              <span className="text-muted-foreground w-full font-medium">
                npm dependencies:
              </span>
              <div
                className="relative group cursor-pointer"
                onClick={copyAllDependencies}
              >
                {isLibDepsHovered &&
                  Object.keys(npmDependencies).length > 1 && (
                    <span className="whitespace-nowrap">
                      {copiedLibDependencies ? "Copied all!" : "Copy all"}
                    </span>
                  )}
              </div>
            </div>

            <div className="pl-1/3 flex flex-col">
              {Object.entries(npmDependencies).map(([dep, version]) => (
                <div
                  key={dep}
                  className="flex items-center justify-between group hover:bg-accent rounded-md p-1 -mx-2"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://www.npmjs.com/package/${dep}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="pl-1">{dep}</span>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View on npmjs.com</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`https://www.npmjs.com/package/${dep}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:bg-accent-hover rounded relative overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative p-1 transition-all duration-300 ease-in-out hover:translate-x-[2px] hover:-translate-y-[2px]">
                            <ArrowUpRight size={16} />
                          </div>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View on npmjs.com</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => copySingleDependency(dep, version)}
                          className="p-1 hover:bg-accent-hover rounded"
                        >
                          {copiedDependency === dep ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copiedDependency === dep ? "Copied!" : "Copy"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {Object.keys(directRegistryDependencies).length > 0 && (
        <>
          <Separator className="w-full !my-6" />
          <div className="flex flex-col">
            <div className="flex items-center mb-2 justify-between">
              <span className="text-muted-foreground w-full font-medium">
                Registry dependencies:
              </span>
            </div>
            <div className="pl-1/3">
              {isLoadingDependencies ? (
                <LoadingSpinner />
              ) : dependencyComponents ? (
                <ComponentsList components={dependencyComponents!} />
              ) : (
                <span>Error loading registry dependencies</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
