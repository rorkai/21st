import React from "react"
import Link from "next/link"

import { CalendarDays, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { User } from "@/types/global"

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"

export const UserAvatar = ({
  src,
  alt,
  size = 40,
  user,
  className,
  isClickable,
}: {
  src?: string
  alt?: string | null
  size?: number
  isClickable?: boolean
  user?: User
  className?: string
}) => {
  const avatarContent = (
    <Avatar
      className={cn("group", isClickable && "cursor-pointer", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage src={src} alt={alt ?? undefined} />
      <AvatarFallback>{alt?.[0]?.toUpperCase()}</AvatarFallback>
    </Avatar>
  )

  if (!user) {
    return avatarContent
  }

  const wrappedAvatar = isClickable ? (
    <Link href={`/${user.username}`}>{avatarContent}</Link>
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
        <div className="flex gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={src} alt={alt ?? undefined} />
            <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Link href={`/${user.username}`} className="hover:underline">
              <h4 className="text-sm font-semibold">{user.name}</h4>
            </Link>
            <Link href={`/${user.username}`} className="hover:underline">
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </Link>
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
      </HoverCardContent>
    </HoverCard>
  )
}
