'use client'

import React from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { useAtom } from 'jotai'
import { searchAtom } from './ComponentsListMainPage'
import { Input } from "@/components/ui/input"
import { Hotkey } from "./ui/hotkey"
import { cn } from "@/lib/utils"
import { Icons } from "./icons"

interface ClientHeaderProps {
  isMobile: boolean
  isPublishPage: boolean
}

export function ClientHeader({ isMobile, isPublishPage }: ClientHeaderProps) {
  const [searchTerm, setSearchTerm] = useAtom(searchAtom)
  const inputRef = React.useRef<HTMLInputElement>(null);

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
          </Link>
          <Link
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
  )
}
