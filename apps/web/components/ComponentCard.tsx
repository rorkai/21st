/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { Component } from "../types/types"
import { UserAvatar } from "./UserAvatar"
import { LikeButton } from "./LikeButton"

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
            className="w-full h-full object-cover border border-gray-200 rounded-lg hover:border hover:border-gray-300"
          />
        </div>
        <div className="flex items-center space-x-3">
          <UserAvatar
            src={component.user.image_url || "/placeholder.svg"}
            alt={component.user.name}
            size={24}
          />
          <h2 className="text-sm font-medium text-gray-900 truncate flex-grow">
            {component.name}
          </h2>
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
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
