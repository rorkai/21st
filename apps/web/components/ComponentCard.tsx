/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { Heart, Download } from "lucide-react"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { Component } from "../types/types"
import { UserAvatar } from "./UserAvatar"
import { Skeleton } from "./ui/skeleton"

interface ComponentCardProps {
  component: Component
  isLoading?: boolean
}

export function ComponentCard({ component, isLoading }: ComponentCardProps) {
  const componentUrl = `/${component.user.username}/${component.component_slug}`

  if (isLoading) {
    return (
      <div className="overflow-hidden">
        <div className="relative aspect-[4/3] mb-3">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center space-x-2 ml-auto">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-4 h-4" />
          </div>
        </div>
      </div>
    )
  }

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
          <div className="flex items-center space-x-2 text-gray-500 text-xs">
            <span className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              {component.likes_count || 0}
            </span>
            <span className="flex items-center">
              <Download className="w-3 h-3 mr-1" />
              {component.downloads_count || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
