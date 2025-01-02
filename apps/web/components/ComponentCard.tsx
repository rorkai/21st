/* eslint-disable @next/next/no-img-element */
import { formatDistanceToNow } from "date-fns"
import { Video } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Component, User } from "../types/global"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { ComponentVideoPreview } from "./ComponentVideoPreview"
import { CopyComponentButton } from "./CopyComponentButton"
import { UserAvatar } from "./UserAvatar"
import { CopyPromptButton } from "./CopyPromptButton"
import { cn } from "@/lib/utils"

export function ComponentCard({
  component,
}: {
  component: Component & {
    user: User
    code: string | null
    demo_code: string | null
    direct_registry_dependencies: Record<string, string> | null
    dependencies: Record<string, string> | null
    npm_dependencies_of_registry_dependencies: Record<string, string> | null
    tailwind_config: string | null
    global_css: string | null
  }
  isLoading?: boolean
}) {
  const componentUrl = `/${component.user.username}/${component.component_slug}`
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const handleDropdownChange = (open: boolean) => {
    setIsDropdownOpen(open)
    if (!open) {
      // Если дропдаун закрывается, держим состояние ховера еще 2 секунды
      setIsHovering(true)
      setTimeout(() => setIsHovering(false), 2000)
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden",
        isHovering
          ? "group-hover/card [&>*]:group-hover/card:opacity-100"
          : "group/card",
      )}
    >
      <Link href={componentUrl} className="block cursor-pointer">
        <div className="relative aspect-[4/3] mb-3 group">
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className="relative w-full h-full">
              <div className="absolute inset-0" style={{ margin: "-1px" }}>
                <ComponentPreviewImage
                  src={component.preview_url || "/placeholder.svg"}
                  alt={component.name}
                  fallbackSrc="/placeholder.svg"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 to-foreground/5" />
            </div>
            {component.video_url && (
              <ComponentVideoPreview component={component} />
            )}
          </div>
          {component.video_url && (
            <div
              className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-md px-2 py-1 pointer-events-none"
              data-video-icon={`${component.id}`}
            >
              <Video size={16} className="text-foreground" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-center space-x-3">
        <UserAvatar
          src={component.user.image_url || "/placeholder.svg"}
          alt={component.user.name}
          size={24}
          user={component.user}
          isClickable
        />
        <div className="grid grid-cols-[1fr,auto] items-center w-full min-w-0">
          <Link href={componentUrl} className="block cursor-pointer min-w-0">
            <h2 className="text-sm font-medium text-foreground truncate">
              {component.name}
            </h2>
          </Link>
          <div className="relative ml-3 h-6 flex items-center">
            <span
              className="text-xs text-muted-foreground whitespace-nowrap group-hover/card:opacity-0 data-[dropdown-open=true]:opacity-0 transition-opacity"
              data-dropdown-open={isDropdownOpen || isHovering}
            >
              {formatDistanceToNow(new Date(component.created_at), {
                addSuffix: false,
                includeSeconds: false,
              }).replace("about ", "")}
            </span>
            <div
              className="absolute bg-background right-0 opacity-0 group-hover/card:opacity-100 data-[dropdown-open=true]:opacity-100 transition-opacity flex items-center gap-2 pl-2"
              data-dropdown-open={isDropdownOpen || isHovering}
            >
              <CopyComponentButton codeUrl={component.code} variant="minimal" />
              <CopyPromptButton
                componentId={component.id.toString()}
                componentName={component.name}
                code={component.code}
                demoCode={component.demo_code}
                codeFileName={component.code?.split("/").slice(-1)[0]}
                demoCodeFileName={component.demo_code?.split("/").slice(-1)[0]}
                registryDependencies={
                  component.direct_registry_dependencies || {}
                }
                npmDependencies={component.dependencies || {}}
                npmDependenciesOfRegistryDependencies={
                  component.npm_dependencies_of_registry_dependencies || {}
                }
                tailwindConfig={component.tailwind_config || ""}
                globalCss={component.global_css || ""}
                onOpenChange={handleDropdownChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
