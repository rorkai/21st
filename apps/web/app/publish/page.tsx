"use client"

import React, { useEffect } from "react"
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import ComponentForm from "@/components/ComponentForm/ComponentForm"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import Head from "next/head"
import Link from "next/link"

export default function PublishPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/publish")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Head>
        <title>Publish New Component | Component Library</title>
      </Head>
      <SignedIn>
        <Link
          href="/"
          className="absolute top-4 left-4 cursor-pointer w-5 h-5 flex items-center justify-center"
        >
          <div className="w-full h-full z-10 rounded-full bg-foreground" />
        </Link>
        <div className="flex flex-col items-center gap-7 h-screen w-full">
          <ComponentForm />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
