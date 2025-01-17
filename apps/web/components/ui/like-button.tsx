"use client"

import React, { useEffect, useState } from "react"

import { useUser } from "@clerk/nextjs"
import { Heart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useLikeMutation } from "@/lib/queries"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  componentId: number
  componentLikesCount?: number
  size?: number
  showTooltip?: boolean
  liked: boolean
  onClick?: () => void
}

export function LikeButton({
  componentId,
  componentLikesCount = 0,
  size = 18,
  showTooltip = false,
  liked,
  onClick,
}: LikeButtonProps) {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const likeMutation = useLikeMutation(supabase, user?.id)
  const [isHovered, setIsHovered] = useState(false)
  const [localLikesCount, setLocalLikesCount] = useState(componentLikesCount)

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
    setLocalLikesCount(liked ? localLikesCount - 1 : localLikesCount + 1)
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

  useEffect(() => {
    setLocalLikesCount(componentLikesCount)
  }, [componentLikesCount])

  const button = (
    <Button
      onClick={onClick ?? handleLike}
      disabled={likeMutation.isPending}
      variant="ghost"
      className="h-8 px-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Heart
        size={size}
        fill={liked || isHovered ? "red" : "none"}
        className={cn(
          "h-[18px] w-[18px]",
          liked || isHovered
            ? "stroke-none scale-110 transition-transform"
            : "",
        )}
      />
      {localLikesCount !== undefined && (
        <span className="ms-1.5 text-xs font-medium text-muted-foreground">
          {localLikesCount}
        </span>
      )}
    </Button>
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
