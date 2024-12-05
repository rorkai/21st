/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { ComponentVideoPreview } from "./ComponentVideoPreview"
import { Component, User } from "../types/global"
import { UserAvatar } from "./UserAvatar"
import { Video } from "lucide-react"

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
          {component.video_url && (
            <div
              className="absolute top-2 left-2 bg-background/90 backdrop-blur rounded-md px-2 py-1 pointer-events-none"
              data-video-icon={`${component.id}`}
            >
              <Video size={16} className="text-foreground" />
            </div>
          )}
          <ComponentPreviewImage
            src={component.preview_url || "/placeholder.svg"}
            alt={component.name}
            fallbackSrc="/placeholder.svg"
            className="w-full h-full object-cover border border-border rounded-lg"
          />
          {component.video_url && (
            <ComponentVideoPreview component={component} />
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
        </div>
      </div>
    </Link>
  )
}
