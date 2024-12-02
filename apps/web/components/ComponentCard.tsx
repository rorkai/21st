/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import ComponentPreviewImage from "./ComponentPreviewImage"
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

  const toggleVideoIcon = (hide: boolean) => {
    const videoIcon = document.querySelector(`[data-video-icon-${component.id}]`) as HTMLElement
    if (videoIcon) {
      videoIcon.style.opacity = hide ? '0' : '1'
      videoIcon.style.visibility = hide ? 'hidden' : 'visible'
    }
  }

  return (
    <Link
      href={componentUrl}
      className="block"
      onMouseEnter={() => toggleVideoIcon(true)}
      onMouseLeave={() => toggleVideoIcon(false)}
    >
      <div className="overflow-hidden">
        <div className="relative aspect-[4/3] mb-3 group">
          {component.video_url && (
            <div className="absolute top-2 left-2 bg-white bg-opacity-70 rounded-md px-2 py-1 pointer-events-none" data-video-icon={component.id}>
              <Video size={16} />
            </div>
          )}
          <ComponentPreviewImage
            src={component.preview_url || "/placeholder.svg"}
            alt={component.name}
            fallbackSrc="/placeholder.svg"
            className="w-full h-full object-cover border border-border rounded-lg"
          />
          {component.video_url && (
            <video
              src={component.video_url}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute top-0 left-0 w-full h-full object-cover border border-border rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
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
