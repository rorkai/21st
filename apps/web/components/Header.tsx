"use client"

import Image from "next/image"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import React from "react"
import { motion } from "framer-motion"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { useAtom } from 'jotai'
import { searchAtom } from './ComponentsListMainPage'
import { Input } from "@/components/ui/input"
import { Hotkey } from "./ui/hotkey"
import { useIsMobile } from "@/utils/useMediaQuery"
import { Icons } from "./icons"
import { Logo } from "./Logo"
interface HeaderProps {
  tagName?: string
  page?: string
}

const uiSystems = [
  {
    title: "Shadcn/UI",
    href: "/s/shadcn",
    description: "Beautifully designed components that you can copy and paste into your apps.",
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

export function Header({ tagName, page }: HeaderProps) {
  const isHomePage = page === "home"
  const isPublishPage = page === "publish"
  const isComponentsPage = page === "components"
  const [searchTerm, setSearchTerm] = useAtom(searchAtom)
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      } else if (event.key === 'Escape') {
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="flex fixed top-0 left-0 right-0 h-14 z-50 items-center justify-between border-b border-gray-200 px-4 py-3 bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <motion.div
            layoutId="logo"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Logo
              size={28}
            />
          </motion.div>
          {!isHomePage && tagName && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-[14px] font-medium">{tagName}</span>
            </>
          )}
        </div>
        {!isMobile && !tagName && !isComponentsPage && (
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>UI Systems</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    {uiSystems.map((system) => (
                      <ListItem
                        key={system.title}
                        title={system.title}
                        href={system.href}
                      >
                        {system.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Component Types</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {componentTypes.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!isMobile && (
         
          <div className="flex items-center gap-1 -mr-2">
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
                "h-8 w-8 px-0"
              )}
            >
              <Icons.gitHub className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </div>
          </Link><Link
            href="https://x.com/serafimcloud"
            target="_blank"
            rel="noreferrer"
          >
              <div
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                  }),
                  "h-8 w-8 px-0"
                )}
              >
                <Icons.twitter className="h-3 w-3 fill-current" />
                <span className="sr-only">Twitter</span>
              </div>
            </Link>
          </div>
        )}
        
        <div className="relative flex items-center max-w-[400px]">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-14"
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
            <Hotkey keys={["K"]} modifier={true} />
          </div>
        </div>
        
        {!isMobile && (
          <>
            <SignedIn>
              {!isPublishPage && (
                <Button asChild>
                  <Link href="/publish">Publish</Link>
                </Button>
              )}
              <UserButton />
            </SignedIn>
            <SignedOut>
              <div className="text-sm">
                <SignInButton />
              </div>
            </SignedOut>
          </>
        )}
      </div>
    </header>
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
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
