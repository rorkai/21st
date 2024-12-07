"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  SignInButton,
  SignedIn,
  SignedOut,
  useClerk,
  UserProfile,
} from "@clerk/nextjs"
import { UserAvatar } from "./UserAvatar"
import { atom, useAtom } from "jotai"
import { Input } from "@/components/ui/input"
import { Hotkey } from "./ui/hotkey"
import { useIsMobile } from "@/hooks/use-media-query"
import { HeaderServer } from "./HeaderServer"
import {
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, X } from "lucide-react"

export const searchQueryAtom = atom("")

export function Header({ tagName, page }: { tagName?: string; page?: string }) {
  const isHomePage = page === "home"
  const isPublishPage = page === "publish"
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const { user, signOut } = useClerk()
  const [showUserProfile, setShowUserProfile] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        inputRef.current?.focus()
      } else if (event.key === "Escape") {
        inputRef.current?.blur()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <>
      <header className="flex fixed top-0 left-0 right-0 h-14 z-50 items-center justify-between border-b border-border/40 px-4 py-3 bg-background text-foreground">
        <div className="flex items-center gap-4">
          <HeaderServer tagName={tagName} isHomePage={isHomePage} />
        </div>

        <div className="flex items-center gap-2">
          <HeaderServer.SocialIcons isMobile={isMobile} />
          {!isMobile && <HeaderServer.ThemeToggle />}
          {page === "home" && (
            <div className="relative flex items-center max-w-[400px]">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-14"
              />
              <div className="absolute top-0 right-3 h-full flex items-center pointer-events-none">
                <Hotkey keys={["K"]} modifier={true} variant="outline" />
              </div>
            </div>
          )}

          {!isMobile && (
            <>
              <SignedIn>
                {!isPublishPage && (
                  <Button asChild>
                    <Link href="/publish">Publish</Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer rounded-full">
                    <UserAvatar
                      src={user?.imageUrl}
                      alt={user?.fullName}
                      size={32}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onSelect={() =>
                        (window.location.href = `/${user?.externalAccounts?.[0]?.username}`)
                      }
                    >
                      <User className="w-4 h-4 mr-2" />
                      My profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowUserProfile(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => signOut({ redirectUrl: "/" })}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SignedIn>

              <SignedOut>
                <SignInButton>
                  <Button>Publish</Button>
                </SignInButton>
              </SignedOut>
            </>
          )}
        </div>
      </header>
      {showUserProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10"
          onClick={() => setShowUserProfile(false)}
        >
          <div className="relative">
            <UserProfile />
            <Button
              variant="ghost"
              onClick={() => setShowUserProfile(false)}
              className="absolute top-4 right-4 w-8 h-8 text-muted-foreground text-sm rounded flex items-center justify-center"
            >
              <X className="min-w-4 min-h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none text-foreground">
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
