import { useState } from "react"
import Link from "next/link"

import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { Component, Tag, User } from "@/types/global"

import { UserAvatar } from "@/components/UserAvatar"
import { LoadingSpinner } from "./LoadingSpinner"
import { ComponentsList } from "./ComponentsList"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tag as TagComponent } from "@/components/ui/tag"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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

import {
  ArrowUpRight,
  Check,
  Copy,
  Scale,
  CalendarDays,
  Info,
  Binoculars,
} from "lucide-react"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { getLicenseBySlug } from "@/lib/licenses"
import { formatDate } from "@/lib/utils"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { useHunterUser } from "@/lib/queries"

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
      staleTime: 1000 * 60 * 15, // Consider data fresh for 15 minutes
      gcTime: 1000 * 60 * 60, // Keep unused data in cache for 1 hour
      refetchOnWindowFocus: false,
    })

  const { data: hunterUser } = useHunterUser(component.hunter_username)

  const copyAllDependencies = () => {
    const dependenciesString = Object.entries({
      ...npmDependencies,
    })
      .map(([dep, version]) => `"${dep}": "${version}"`)
      .join(",\n")
    navigator?.clipboard?.writeText(`{\n${dependenciesString}\n}`)
    setCopiedLibDependencies(true)
    toast("Dependencies copied to clipboard")
    trackEvent(AMPLITUDE_EVENTS.COPY_ALL_DEPENDENCIES, {
      componentId: component.id,
      componentName: component.name,
      dependenciesCount: Object.keys(npmDependencies).length,
    })
    setTimeout(() => setCopiedLibDependencies(false), 2000)
  }

  const copySingleDependency = (dep: string, version: string) => {
    navigator?.clipboard?.writeText(`"${dep}": "${version}"`)
    setCopiedDependency(dep)
    toast("Dependency copied to clipboard")
    trackEvent(AMPLITUDE_EVENTS.COPY_DEPENDENCY, {
      componentId: component.id,
      componentName: component.name,
      dependency: dep,
      version,
    })
    setTimeout(() => setCopiedDependency(null), 2000)
  }

  const license = component.license ? getLicenseBySlug(component.license) : null

  const handleNpmPackageClick = (packageName: string) => {
    trackEvent(AMPLITUDE_EVENTS.VIEW_ON_NPM, {
      componentId: component.id,
      componentName: component.name,
      packageName,
    })
    window.open(`https://www.npmjs.com/package/${packageName}`, "_blank")
  }

  return (
    <div className="text-sm overflow-y-auto max-h-[calc(100vh-100px)] bg-background dark:bg-muted text-foreground">
      <div className="p-4 space-y-3 bg-muted dark:bg-background">
        {component.name && (
          <div className="flex items-center font-medium">
            <span>{component.name}</span>
          </div>
        )}
        {component.description && (
          <div className="flex items-start">
            <span className="whitespace-pre-wrap">{component.description}</span>
          </div>
        )}
      </div>
      <Separator className="w-full" />
      <div className="px-4 pt-2.5 pb-6 space-y-3">
        {component.user && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">Created by</span>
            <HoverCard openDelay={300}>
              <HoverCardTrigger asChild>
                <div className="flex items-center justify-start hover:bg-accent rounded-md px-2 py-1 -mx-2 mr-auto">
                  <Link
                    href={`/${component.user.username}`}
                    className="flex items-center"
                  >
                    <UserAvatar
                      src={component.user.image_url || "/placeholder.svg"}
                      alt={component.user.name || component.user.username}
                      size={20}
                    />
                    <span className="ml-1 font-medium">
                      {component.user.name || component.user.username}
                    </span>
                  </Link>
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                align="start"
                className="w-[320px]"
                side="bottom"
              >
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={component.user.image_url || "/placeholder.svg"}
                      alt={component.user.name || component.user.username || ""}
                    />
                    <AvatarFallback>
                      {component.user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <Link
                      href={`/${component.user.username}`}
                      className="hover:underline"
                    >
                      <h4 className="text-sm font-semibold">
                        {component.user.name || component.user.username}
                      </h4>
                    </Link>
                    <Link
                      href={`/${component.user.username}`}
                      className="hover:underline"
                    >
                      <p className="text-sm text-muted-foreground">
                        @{component.user.username}
                      </p>
                    </Link>
                    {component.user.bio && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {component.user.bio}
                      </p>
                    )}
                    {component.user.created_at && (
                      <div className="flex items-center pt-1">
                        {!component.user.manually_added ? (
                          <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                        ) : (
                          <Info className="mr-2 h-4 w-4 opacity-70" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {component.user.manually_added
                            ? `Created by 21st.dev`
                            : `Joined ${formatDate(new Date(component.user.created_at))}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        )}

        {hunterUser && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">Hunted by</span>
            <HoverCard openDelay={300}>
              <HoverCardTrigger asChild>
                <div className="flex items-center justify-start hover:bg-accent rounded-md px-2 py-1 -mx-2 mr-auto">
                  <Link
                    href={`/${hunterUser.username}`}
                    className="flex items-center"
                  >
                    <UserAvatar
                      src={hunterUser.image_url || "/placeholder.svg"}
                      alt={hunterUser.name || hunterUser.username}
                      size={20}
                    />
                    <span className="ml-1 font-medium">
                      {hunterUser.name || hunterUser.username}
                    </span>
                  </Link>
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                align="start"
                className="w-[320px]"
                side="bottom"
              >
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={hunterUser.image_url || "/placeholder.svg"}
                      alt={hunterUser.name || hunterUser.username || ""}
                    />
                    <AvatarFallback>
                      {hunterUser.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <Link
                      href={`/${hunterUser.username}`}
                      className="hover:underline"
                    >
                      <h4 className="text-sm font-semibold">
                        {hunterUser.name || hunterUser.username}
                      </h4>
                    </Link>
                    <Link
                      href={`/${hunterUser.username}`}
                      className="hover:underline"
                    >
                      <p className="text-sm text-muted-foreground">
                        @{hunterUser.username}
                      </p>
                    </Link>
                    {hunterUser.bio && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {hunterUser.bio}
                      </p>
                    )}
                    {hunterUser.created_at && (
                      <div className="flex items-center pt-1">
                        {!hunterUser.manually_added ? (
                          <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                        ) : (
                          <Binoculars className="mr-2 h-4 w-4 opacity-70" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {hunterUser.manually_added
                            ? `Component hunter`
                            : `Joined ${formatDate(new Date(hunterUser.created_at))}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        )}

        {component.registry && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">Registry</span>
            <div>
              <Badge variant="outline">{component.registry}</Badge>
            </div>
          </div>
        )}

        {component.website_url && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">Website</span>
            <div className="flex items-center justify-between group hover:bg-accent rounded-md p-1 -mx-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={component.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="pl-1">
                      {(() => {
                        const url = new URL(component.website_url)
                        const domain = url.hostname.replace("www.", "")

                        const cleanPath =
                          url.pathname?.slice(1).split("?")[0] || ""

                        const segments = cleanPath.split("/").filter(Boolean)

                        const formattedPath =
                          segments.length > 0
                            ? segments.length === 1
                              ? segments[0]?.slice(0, 12)
                              : segments
                                  .slice(0, 2)
                                  .map((s) => s.slice(0, 6))
                                  .join("/")
                            : ""

                        return (
                          <>
                            {domain}
                            {formattedPath && (
                              <span className="text-muted-foreground">
                                /{formattedPath}
                                {segments.length > 2 ||
                                (segments.length === 1 &&
                                  (segments[0]?.length ?? 0) > 12) ||
                                (segments.length === 2 &&
                                  ((segments[0]?.length ?? 0) > 6 ||
                                    (segments[1]?.length ?? 0) > 6))
                                  ? "..."
                                  : ""}
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </span>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visit website</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={component.website_url}
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
                    <p>Visit website</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {license && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">License</span>
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
          </div>
        )}

        {component.tags && component.tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-2">
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
                  npm dependencies
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
                          onClick={() => handleNpmPackageClick(dep)}
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
    </div>
  )
}
