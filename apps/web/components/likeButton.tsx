"use client"

import React, { useState } from "react"
import {
  useHasUserLikedComponent,
  useLikeComponent,
  useUnlikeComponent,
} from "../hooks/useLikes"
import { Heart } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { Hotkey } from "./ui/hotkey"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  componentId: number
  size?: number
  showTooltip?: boolean
  onLike?: () => void
  variant?: "default" | "circle"
}

export function LikeButton({
  componentId,
  size = 18,
  showTooltip = false,
  onLike,
  variant = "default",
}: LikeButtonProps) {
  const { data: hasLiked } = useHasUserLikedComponent(componentId)
  const likeMutation = useLikeComponent()
  const unlikeMutation = useUnlikeComponent()
  const [isHovered, setIsHovered] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onLike) {
      onLike()
    } else {
      if (hasLiked) {
        unlikeMutation.mutate(componentId)
      } else {
        likeMutation.mutate(componentId)
      }
    }
  }

  const isMutating = likeMutation.isPending || unlikeMutation.isPending

  const buttonClasses = cn(
    "flex items-center justify-center relative transition-colors duration-200",
    variant === "default"
      ? "h-8 w-8 hover:bg-gray-100 rounded-md"
      : "p-1 hover:bg-gray-200 rounded-full",
  )

  const button = (
    <button
      onClick={handleLike}
      disabled={isMutating}
      className={buttonClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Heart
        size={size}
        fill={hasLiked || isHovered ? "red" : "none"}
        className={cn(hasLiked || isHovered ? "text-red-500" : "text-gray-500")}
      />
    </button>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>
            {hasLiked ? "Unlike" : "Like"}
            <Hotkey keys={["L"]} isDarkBackground={true} />
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
