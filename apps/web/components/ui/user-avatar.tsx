import React from "react"
import Link from "next/link"

import { CalendarDays, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { User } from "@/types/global"

import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card"

interface UserAvatarProps
  extends React.ComponentPropsWithoutRef<typeof Avatar> {
  src?: string | null
  alt?: string
  size?: number
  user?: User
  isClickable?: boolean
  className?: string
}

export function UserAvatar({
  src,
  alt,
  size = 40,
  user,
  isClickable,
  className,
  ...props
}: UserAvatarProps) {
  const avatarContent = (
    <Avatar
      className={cn("group", isClickable && "cursor-pointer", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage src={src || "/placeholder.svg"} alt={alt || "User avatar"} />
      <AvatarFallback>
        {alt
          ? alt
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : "U"}
      </AvatarFallback>
    </Avatar>
  )

  if (!user) {
    return avatarContent
  }

  const wrappedAvatar = isClickable ? (
    <Link
      href={`/${user.display_username || user.username}`}
      className="no-underline"
    >
      {avatarContent}
    </Link>
  ) : (
    avatarContent
  )

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{wrappedAvatar}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[320px]"
        side="bottom"
        alignOffset={-10}
      >
        <Link
          href={`/${user.display_username || user.username}`}
          className="no-underline cursor-pointer"
        >
          <div className="flex gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={
                  user.display_image_url || user.image_url || "/placeholder.svg"
                }
                alt={user.display_name || user.name || "User avatar"}
              />
              <AvatarFallback>
                {(user.display_name || user.name)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">
                {user.display_name || user.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                @{user.display_username || user.username}
              </p>
              {user.bio && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}
              {user.created_at && (
                <div className="flex items-center pt-1">
                  {!user.manually_added ? (
                    <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                  ) : (
                    <Info className="mr-2 h-4 w-4 opacity-70" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {user.manually_added
                      ? `Created by 21st.dev`
                      : `Joined ${formatDate(new Date(user.created_at))}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}
