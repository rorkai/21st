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
import { EditProfileDialog } from "@/components/features/profile/edit-profile-dialog"
import { useUserProfile } from "@/components/hooks/use-user-profile"
import { useAnimation } from "framer-motion"

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
  const { signOut } = useClerk()
  const { user: dbUser, clerkUser: user, isLoading } = useUserProfile()
  const [showEditProfile, setShowEditProfile] = useState(false)
  const searchParams = useSearchParams()
  const step = searchParams.get("step")
  const controls = useAnimation()
  // Debug logs
  console.log("DB User:", dbUser)
  console.log("Clerk User:", user)

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
                      src={
                        dbUser?.display_image_url || user?.imageUrl || undefined
                      }
                      alt={dbUser?.display_name || user?.fullName || undefined}
                      size={32}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[240px] p-0" align="end">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm text-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>

                    <div className="p-1">
                      <DropdownMenuItem
                        className="text-sm px-3 py-2 cursor-pointer"
                        onSelect={() =>
                          (window.location.href = `/${dbUser?.display_username || user?.externalAccounts?.[0]?.username}`)
                        }
                      >
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-sm px-3 py-2 cursor-pointer"
                        onSelect={() => setShowEditProfile(true)}
                      >
                        Edit Profile
                      </DropdownMenuItem>
                    </div>

                    <div className="border-t border-border p-1">
                      <DropdownMenuItem
                        className="text-sm px-3 py-2 cursor-pointer"
                        onSelect={() => window.open("/terms", "_blank")}
                      >
                        Terms of Service
                      </DropdownMenuItem>
                    </div>

                    <div className="border-t border-border p-1">
                      <DropdownMenuItem
                        onSelect={() => signOut({ redirectUrl: "/" })}
                        className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                        onMouseEnter={() => controls.start("hover")}
                        onMouseLeave={() => controls.start("normal")}
                      >
                        <span>Log Out</span>
                        <Icons.logout size={16} controls={controls} />
                      </DropdownMenuItem>
                    </div>
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
      {showEditProfile && dbUser && !isLoading && (
        <EditProfileDialog
          isOpen={showEditProfile}
          setIsOpen={setShowEditProfile}
          user={{
            name: user?.fullName || "",
            username: user?.externalAccounts?.[0]?.username || "",
            image_url: user?.imageUrl || "",
            display_name: dbUser.display_name || null,
            display_username: dbUser.display_username || null,
            display_image_url: dbUser.display_image_url || null,
            bio: dbUser.bio || null,
            website_url: dbUser.website_url || null,
            github_url: dbUser.github_url || null,
            twitter_url: dbUser.twitter_url || null,
          }}
          onUpdate={() => {
            setShowEditProfile(false)
            window.location.reload() // Refresh to show updated data
          }}
        />
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
