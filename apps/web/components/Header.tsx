"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"

import { atom } from "jotai"
import {
  SignInButton,
  SignedIn,
  SignedOut,
  useClerk,
  UserProfile,
} from "@clerk/nextjs"
import { LogOut, Settings, X, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"

import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

import { HeaderServer } from "./HeaderServer"
import { UserAvatar } from "./UserAvatar"

export const searchQueryAtom = atom("")

export function Header({ tagName, page }: { tagName?: string; page?: string }) {
  const isHomePage = page === "home"
  const isPublishPage = page === "publish"
  const isProPage = page === "pro"
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
      <header className={cn("flex fixed top-0 left-0 right-0 h-14 z-50 items-center justify-between px-4 py-3 text-foreground", {
        "border-b border-border/40 bg-background": !isPublishPage
      })}>
        <div className="flex items-center gap-4">
          <HeaderServer
            tagName={tagName}
            isHomePage={isHomePage}
            isProPage={isProPage}
          />
        </div>

        <div className="flex items-center">
          {!isMobile && <HeaderServer.ThemeToggle />}
          <HeaderServer.SocialIcons />
          {!isMobile && (
            <>
              <SignedIn>
                {!isPublishPage && (
                  <Button asChild className="ml-2">
                    <Link href="/publish">Publish</Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer rounded-full ml-2">
                    <UserAvatar
                      src={user?.imageUrl}
                      alt={user?.fullName}
                      size={32}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-w-64" align="start">
                    <DropdownMenuLabel
                      className="flex items-center gap-3 cursor-pointer rounded-md hover:bg-accent transition-colors"
                      onClick={() =>
                        (window.location.href = `/${user?.externalAccounts?.[0]?.username}`)
                      }
                    >
                      <UserAvatar
                        src={user?.imageUrl}
                        alt={user?.fullName}
                        size={32}
                        className="shrink-0"
                      />
                      <div className="flex min-w-0 flex-col justify-center">
                        <span className="truncate text-sm font-medium text-foreground">
                          {user?.fullName}
                        </span>
                        <span className="truncate text-xs font-normal text-muted-foreground">
                          {user?.primaryEmailAddress?.emailAddress}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setShowUserProfile(true)}>
                      <Settings className="w-4 h-4 mr-2 opacity-60" />
                      <span>Manage account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => window.open("/terms", "_blank")}
                    >
                      <FileText className="w-4 h-4 mr-2 opacity-60" />
                      <span>Terms of Service</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => signOut({ redirectUrl: "/" })}
                    >
                      <LogOut className="w-4 h-4 mr-2 opacity-60" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SignedIn>

              <SignedOut>
                <SignInButton>
                  <Button className="ml-2">Publish</Button>
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
