/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Icons } from "./icons"
import { ThemeToggle } from "./ThemeToggle"
import { GitHubStars } from "./GitHubStars"

import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"

const uiSystems = [
  {
    title: "shadcn/ui",
    href: "/s/shadcn",
    description:
      "Beautifully designed components that you can copy and paste into your apps.",
  },
  {
    title: "MagicUI",
    href: "/magicui",
    description: "Enchanting UI components for modern web applications.",
  },
  {
    title: "Aceternity UI",
    href: "/aceternity",
    description: "Aceternity UI components for building modern websites.",
  },
]

const componentTypes = [
  {
    title: "Buttons",
    href: "/s/button",
    description: "Clickable things that do stuff when you press them.",
  },
  {
    title: "Cards",
    href: "/s/card",
    description: "Boxes that group related stuff together neatly.",
  },
  {
    title: "Hero Sections",
    href: "/s/hero",
    description: "Eye-catching header sections for your landing pages.",
  },
  {
    title: "Backgrounds",
    href: "/s/background",
    description: "Beautiful background patterns and effects.",
  },
  {
    title: "Features",
    href: "/s/features",
    description: "Showcase your product's key features and benefits.",
  },
  {
    title: "Typography",
    href: "/s/text",
    description: "Typography components for effective content display.",
  },
  {
    title: "Bento Grids",
    href: "/s/bento",
    description: "Cool grid layouts that look like Japanese lunch boxes.",
  },
  {
    title: "Landing Pages",
    href: "/s/landing-page",
    description: "Complete landing page templates and sections.",
  },
]

interface HeaderServerProps {
  tagName?: string
  isHomePage: boolean
}

export function HeaderServer({ tagName, isHomePage }: HeaderServerProps) {
  return (
    <div className="flex items-center">
      <Link
        href="/"
        className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer bg-foreground"
      />
      {!isHomePage && tagName && (
        <>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-[14px] font-medium">{tagName}</span>
        </>
      )}
    </div>
  )
}

HeaderServer.SocialIcons = function SocialIcons({
  isMobile,
}: {
  isMobile: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Link href="https://twitter.com/serafimcloud" target="_blank" rel="noreferrer">
        <Button variant="ghost" aria-label="Follow on Twitter" className="fill-foreground">
          <Icons.twitter className="h-[14px] w-[14px]" aria-hidden="true" />
        </Button>
      </Link>
      <Link
        href="https://github.com/rorkai/21st"
        target="_blank"
        rel="noreferrer"
      >
        <Button className="h-8 py-0 pe-0" variant="outline">
          <Icons.gitHub className="h-[18px] w-[18px] me-2" aria-hidden="true" />
          Star
          <GitHubStars />
          <span className="sr-only">GitHub</span>
        </Button>
      </Link>
    </div>
  )
}

HeaderServer.ThemeToggle = ThemeToggle

export { uiSystems, componentTypes }
