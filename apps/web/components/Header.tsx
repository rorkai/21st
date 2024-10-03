"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import React from "react";

interface HeaderProps {
  componentSlug?: string;
  isPublic?: boolean;
  username?: string;
}

export function Header({ componentSlug, isPublic, username }: HeaderProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isPublishPage = pathname === "/publish";
  const isComponentPage = username && componentSlug && pathname === `/${username}/${componentSlug}`;

  return (
    <header className="flex items-center justify-between mx-1">
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
        {isComponentPage && (
          <div className="text-[14px] border border-gray-200 rounded-full px-2 py-[1px]">
            {isPublic ? (
              <div className="flex gap-2 items-center">
                <LockOpen className="w-3 h-3" />
                <span>Public</span>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </div>
            )}
          </div>
        )}
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
  );
}
