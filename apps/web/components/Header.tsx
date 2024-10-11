"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import React from "react"
import { motion } from "framer-motion"

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
          <motion.div
            layoutId="logo"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Link href="/" className="flex items-center">
              <Image
                src="/cc-logo-circle.svg"
                alt="Logo"
                width={24}
                height={24}
              />
            </Link>
          </motion.div>
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
      </div>
    </header>
  )
}
