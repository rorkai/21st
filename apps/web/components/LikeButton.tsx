"use client"

import React, { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { Hotkey } from "./ui/hotkey"
import { cn } from "@/lib/utils"
import { useLikeMutation } from "@/utils/dataFetchers"
import { useUser } from "@clerk/nextjs"
import { useClerkSupabaseClient } from "@/utils/clerk"

interface LikeButtonProps {
  componentId: number
  size?: number
  showTooltip?: boolean
  variant?: "default" | "circle"
  liked: boolean
  onClick?: () => void
}

export function LikeButton({
  componentId,
  size = 18,
  showTooltip = false,
  liked,
  variant = "default",
  onClick,
}: LikeButtonProps) {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const likeMutation = useLikeMutation(supabase, user?.id)
  const [isHovered, setIsHovered] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    likeMutation.mutate({ componentId, liked })
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "KeyL") {
        e.preventDefault()
        handleLike(e as unknown as React.MouseEvent)
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [liked])

  const buttonClasses = cn(
    "flex items-center justify-center relative transition-colors duration-200",
    variant === "default"
      ? "h-8 w-8 hover:bg-accent rounded-md"
      : "p-1 hover:bg-accent rounded-full",
  )

  const button = (
    <button
      onClick={onClick ? onClick : handleLike}
      disabled={likeMutation.isPending}
      className={buttonClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Heart
        size={size}
        fill={liked || isHovered ? "red" : "none"}
        className={cn(
          liked || isHovered
            ? "stroke-none scale-110 transition-transform"
            : "",
        )}
      />
    </button>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
          <p className="flex items-center">
            {liked ? "Unlike" : "Like"}
            <Hotkey keys={["L"]} />
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
