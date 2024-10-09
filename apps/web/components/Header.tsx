"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import React from "react"

interface HeaderProps {
  componentSlug?: string
  username?: string
}

export function Header({ componentSlug, username }: HeaderProps) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isPublishPage = pathname === "/publish"

  return (
    <header className="flex items-center justify-between border-b border-gray-200 p-4 -mx-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/cc-logo.svg" alt="Logo" width={32} height={32} />
          </Link>
          {!isHomePage && username && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-700">{username}</span>
              {componentSlug && (
                <>
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-700">{componentSlug}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {!isPublishPage && (
          <Button asChild>
            <Link href="/publish">Publish</Link>
          </Button>
        )}
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </div>
    </header>
  )
}
