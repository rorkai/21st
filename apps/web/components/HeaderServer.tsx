import Link from "next/link"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { GitHubStars } from "./GitHubStars"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "./ThemeToggle"
import { Twitter } from "lucide-react"

interface HeaderServerProps {
  tagName?: string
  isHomePage: boolean
  isProPage?: boolean
}

export function HeaderServer({
  tagName,
  isHomePage,
  isProPage,
}: HeaderServerProps) {
  return (
    <div className="flex items-center">
      <Link
        href="/"
        className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer bg-foreground"
      />
      {!isHomePage && (tagName || isProPage) && (
        <>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-[14px] font-medium">
            {isProPage ? "Pro templates" : tagName}
          </span>
        </>
      )}
    </div>
  )
}

HeaderServer.SocialIcons = function SocialIcons() {
  return (
    <div className="flex items-center">
      <Link href="https://x.com/serafimcloud" target="_blank" rel="noreferrer">
        <Button
          variant="ghost"
          aria-label="Follow on Twitter"
          className="fill-foreground size-8"
        >
          <Twitter
            className="min-h-[18px] min-w-[18px] fill-current"
            aria-hidden="true"
          />
        </Button>
      </Link>
      <Link
        href="https://discord.gg/Qx4rFunHfm"
        target="_blank"
        rel="noreferrer"
      >
        <Button
          variant="ghost"
          aria-label="Join Discord"
          className="fill-foreground size-8"
        >
          <Icons.discord
            className="min-h-[18px] min-w-[18px]"
            aria-hidden="true"
          />
        </Button>
      </Link>
      <div className="flex items-center gap-2 ml-1">
        <Link
          href="https://github.com/rorkai/21st"
          target="_blank"
          rel="noreferrer"
        >
          <Button className="h-8 py-0 pe-0 shadow-none" variant="outline">
            <Icons.gitHub
              className="h-[18px] w-[18px] me-2"
              aria-hidden="true"
            />
            Star
            <GitHubStars />
            <span className="sr-only">GitHub</span>
          </Button>
        </Link>
        <Button
          variant="outline"
          className={cn(
            "relative h-8 w-fit justify-start bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 hidden md:inline-flex",
          )}
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            )
          }
        >
          <span className="hidden lg:inline-flex mr-4">Global search...</span>
          <span className="inline-flex lg:hidden mr-4">Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-sans text-[11px] opacity-100 sm:flex">
            <span className="text-[11px] font-sans">⌘</span>K
          </kbd>
        </Button>
      </div>
    </div>
  )
}

HeaderServer.ThemeToggle = ThemeToggle
