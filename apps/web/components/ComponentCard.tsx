/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { Component } from "../types/types"
import { UserAvatar } from "./UserAvatar"
import { LikeButton } from "./Like"

interface ComponentCardProps {
  component: Component
  isLoading?: boolean
}

export function ComponentCard({ component }: ComponentCardProps) {
  const componentUrl = `/${component.user.username}/${component.component_slug}`

  return (
    <Link href={componentUrl} className="block">
      <div className="overflow-hidden">
        <div className="relative aspect-[4/3] mb-3">
          <ComponentPreviewImage
            src={component.preview_url || "/placeholder.svg"}
            alt={component.name}
            fallbackSrc="/placeholder.svg"
            className="w-full h-full object-cover border border-border rounded-lg hover:border-2 hover:border-primary transition-colors duration-200"
          />
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
          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <span className="flex items-center">
              <LikeButton
                componentId={component.id}
                size={14}
                variant="circle"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
