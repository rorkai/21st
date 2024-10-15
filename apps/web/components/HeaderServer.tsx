/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Icons } from "./icons"
import { ThemeToggle } from "./ThemeToggle"

const uiSystems = [
  {
    title: "Shadcn/UI",
    href: "/s/shadcn",
    description:
      "Beautifully designed components that you can copy and paste into your apps.",
  },
  {
    title: "MagicUI",
    href: "/s/magicui",
    description: "Enchanting UI components for modern web applications.",
  },
]

const componentTypes = [
  {
    title: "Buttons",
    href: "/s/button",
    description: "Clickable things that do stuff when you press them.",
  },
  {
    title: "Avatars",
    href: "/s/avatar",
    description: "Little pictures to show who's who.",
  },
  {
    title: "Modals/Dialogs",
    href: "/s/modal-dialog",
    description: "Pop-ups that grab your attention for important stuff.",
  },
  {
    title: "Bento Blocks",
    href: "/s/bento",
    description: "Cool grid layouts that look like Japanese lunch boxes.",
  },
  {
    title: "Menu",
    href: "/s/menu",
    description: "Lists of options to help you get around.",
  },
  {
    title: "Data Display",
    href: "/s/data-visualization",
    description: "Fancy ways to show numbers and info.",
  },
  {
    title: "Cards",
    href: "/s/card",
    description: "Boxes that group related stuff together neatly.",
  },
]

interface HeaderServerProps {
  tagName?: string
  isHomePage: boolean
}

export function HeaderServer({
  tagName,
  isHomePage,
}: HeaderServerProps) {
  return (
    <div className="flex items-center">
      <Link
        href="/"
        className="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer"
      >
        <div className="w-full h-full rounded-full bg-foreground" />
      </Link>
      {!isHomePage && tagName && (
        <>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-[14px] font-medium">{tagName}</span>
        </>
      )}
    </div>
  )
}

HeaderServer.SocialIcons = function SocialIcons() {
  return (
    <div className="flex items-center gap-[2px]">
      <ThemeToggle />
      <Link
        href="https://github.com/rorkai/21st"
        target="_blank"
        rel="noreferrer"
      >
        <div
          className={cn(
            buttonVariants({
              variant: "ghost",
            }),
            "h-8 w-8 px-0",
          )}
        >
          <Icons.gitHub className="h-[18px] w-[18px]" />
          <span className="sr-only">GitHub</span>
        </div>
      </Link>
      <Link href="https://x.com/serafimcloud" target="_blank" rel="noreferrer">
        <div
          className={cn(
            buttonVariants({
              variant: "ghost",
            }),
            "h-8 w-8 px-0",
          )}
        >
          <Icons.twitter className="h-[14px] w-[14px] fill-current" />
          <span className="sr-only">Twitter</span>
        </div>
      </Link>
    </div>
  )
}

export { uiSystems, componentTypes }
