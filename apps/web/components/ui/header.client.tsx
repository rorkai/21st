"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"

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

import { HeaderServer } from "./header"
import { UserAvatar } from "./user-avatar"
import { useSidebar } from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const searchQueryAtom = atom("")

function Logo() {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const [isHovered, setIsHovered] = useState(false)
  const [showTriggerTimeout, setShowTriggerTimeout] = useState(false)

  const sidebar = isHomePage
    ? useSidebar()
    : { open: true, toggleSidebar: () => {} }
  const { open, toggleSidebar } = sidebar

  useEffect(() => {
    if (isHomePage && !open) {
      setShowTriggerTimeout(true)
      const timer = setTimeout(() => {
        setShowTriggerTimeout(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [open, isHomePage])

  const showTrigger = isHomePage && !open && (isHovered || showTriggerTimeout)

  return (
    <div
      className="relative w-7 h-7"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href="/"
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full cursor-pointer bg-foreground transition-all duration-300",
          showTrigger ? "opacity-0 scale-90" : "opacity-100 scale-100",
        )}
      />
      {isHomePage && (
        <>
          {!open && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Toggle Sidebar"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleSidebar()
                  }}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full cursor-pointer text-foreground transition-all duration-300",
                    showTrigger
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-90",
                  )}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    role="img"
                    focusable="false"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M15 5.25A3.25 3.25 0 0 0 11.75 2h-7.5A3.25 3.25 0 0 0 1 5.25v5.5A3.25 3.25 0 0 0 4.25 14h7.5A3.25 3.25 0 0 0 15 10.75v-5.5Zm-3.5 7.25H7v-9h4.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2Zm-6 0H4.25a1.75 1.75 0 0 1-1.75-1.75v-5.5c0-.966.784-1.75 1.75-1.75H5.5v9Z" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent
                className="flex items-center gap-1.5"
                side="right"
              >
                <span>Toggle Sidebar</span>
                <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                  S
                </kbd>
              </TooltipContent>
            </Tooltip>
          )}
          {open && (
            <button
              aria-label="Toggle Sidebar"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleSidebar()
              }}
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full cursor-pointer text-foreground transition-all duration-300",
                showTrigger ? "opacity-100 scale-100" : "opacity-0 scale-90",
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                role="img"
                focusable="false"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M15 5.25A3.25 3.25 0 0 0 11.75 2h-7.5A3.25 3.25 0 0 0 1 5.25v5.5A3.25 3.25 0 0 0 4.25 14h7.5A3.25 3.25 0 0 0 15 10.75v-5.5Zm-3.5 7.25H7v-9h4.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2Zm-6 0H4.25a1.75 1.75 0 0 1-1.75-1.75v-5.5c0-.966.784-1.75 1.75-1.75H5.5v9Z" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function Header({
  text,
  variant = "default",
}: {
  text?: string
  variant?: "default" | "publish"
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const { user, signOut } = useClerk()
  const [showUserProfile, setShowUserProfile] = useState(false)
  const searchParams = useSearchParams()
  const step = searchParams.get("step")

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

  if (variant === "publish" && step) {
    return null
  }

  return (
    <>
      <header
        className={cn(
          "flex fixed top-0 left-0 right-0 h-14 z-40 items-center justify-between px-4 py-3 text-foreground",
          {
            "border-b border-border/40 bg-background": variant !== "publish",
          },
        )}
      >
        <div className="flex items-center gap-4">
          <Logo />
          {text && (
            <div className="flex items-center gap-2">
              <Icons.slash className="text-border w-[22px] h-[22px]" />
              <span className="text-[14px] font-medium">{text}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isMobile && <HeaderServer.ThemeToggle />}
          <HeaderServer.SocialIcons />
          {!isMobile && (
            <>
              <SignedIn>
                {variant !== "publish" && (
                  <Button asChild className="ml-2">
                    <Link href="/publish">Publish component</Link>
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
                  <Button className="ml-2">Publish component</Button>
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
