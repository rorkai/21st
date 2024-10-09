"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import React from "react"
import { Hotkey } from "./ui/hotkey"

interface HeaderProps {
  componentSlug?: string
  username?: string
}

export function Header({ componentSlug, username }: HeaderProps) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isPublishPage = pathname === "/publish"



  return (
    <header className="flex fixed top-0 left-0 right-0 z-50 items-center justify-between border-b border-gray-200 px-4 py-3 bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/cc-logo.svg" alt="Logo" width={24} height={24} />
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
            <Link href="/publish">
              Publish
            </Link>
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
