/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { ComponentVideoPreview } from "./ComponentVideoPreview"
import { Component, User } from "../types/global"
import { UserAvatar } from "./UserAvatar"
import { Video } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function ComponentCard({
  component,
}: {
  component: Component & { user: User }
  isLoading?: boolean
}) {
  const componentUrl = `/${component.user.username}/${component.component_slug}`

  return (
    <Link href={componentUrl} className="block cursor-pointer">
      <div className="overflow-hidden">
        <div className="relative aspect-[4/3] mb-3 group">
          <div className="relative w-full h-full">
            <ComponentPreviewImage
              src={component.preview_url || "/placeholder.svg"}
              alt={component.name}
              fallbackSrc="/placeholder.svg"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 to-foreground/5 rounded-lg" />
          </div>
          {component.video_url && (
            <>
              <div
                className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur rounded-md px-2 py-1 pointer-events-none"
                data-video-icon={`${component.id}`}
              >
                <Video size={16} className="text-foreground" />
              </div>
              <ComponentVideoPreview component={component} />
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <UserAvatar
            src={component.user.image_url || "/placeholder.svg"}
            alt={component.user.name}
            size={24}
          />
          <h2 className="text-sm font-medium text-foreground truncate flex-grow">
            {component.name}
          </h2>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(component.created_at), {
              addSuffix: false,
              includeSeconds: false,
            }).replace("about ", "")}
          </span>
        </div>
      </div>
    </Link>
  )
}
