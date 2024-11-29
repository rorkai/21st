/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { Component, User } from "../types/global"
import { UserAvatar } from "./UserAvatar"

export function ComponentCard({
  component,
}: {
  component: Component & { user: User }
  isLoading?: boolean
}) {
  const componentUrl = `/${component.user.username}/${component.component_slug}`
  console.log("Component video_url:", component.video_url)
  return (
    <Link href={componentUrl} className="block">
      <div className="overflow-hidden">
        <div className="relative aspect-[4/3] mb-3">
          {component.video_url ? (
            <video
              src={component.video_url}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover border border-border rounded-lg hover:border-2 hover:border-primary transition-colors duration-200"
            />
          ) : (
            <ComponentPreviewImage
              src={component.preview_url || "/placeholder.svg"}
              alt={component.name}
              fallbackSrc="/placeholder.svg"
              className="w-full h-full object-cover border border-border rounded-lg hover:border-2 hover:border-primary transition-colors duration-200"
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
