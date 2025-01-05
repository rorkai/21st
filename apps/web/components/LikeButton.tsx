"use client"

import React, { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Heart } from "lucide-react"
import { toast } from "sonner"

import { AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { trackEvent } from "@/lib/amplitude"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useLikeMutation } from "@/lib/queries"
import { cn } from "@/lib/utils"

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

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

  const handleLike = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!user) {
      trackEvent(AMPLITUDE_EVENTS.LIKE_COMPONENT, {
        componentId,
        status: "unauthorized",
        source: e ? "click" : "hotkey",
      })
      return
    }

    likeMutation.mutate({ componentId, liked })
    toast.success(liked ? "Unliked component" : "Liked component")

    trackEvent(
      liked
        ? AMPLITUDE_EVENTS.UNLIKE_COMPONENT
        : AMPLITUDE_EVENTS.LIKE_COMPONENT,
      {
        componentId,
        userId: user.id,
        source: e ? "click" : "hotkey",
      },
    )
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (
        e.code === "KeyL" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        e.target instanceof Element &&
        !e.target.matches("input, textarea")
      ) {
        e.preventDefault()
        handleLike()
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
      onClick={onClick ?? handleLike}
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
          <p className="flex items-center gap-1.5">
            {liked ? "Unlike" : "Like"}
            <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
              L
            </kbd>
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
