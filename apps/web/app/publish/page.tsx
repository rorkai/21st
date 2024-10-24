import React from "react"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import PublishComponentForm from "@/components/publish/PublishComponentForm"

import Head from "next/head"
import Link from "next/link"

export default function PublishPage() {
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
        <div className="flex flex-row items-center h-screen w-full py-4">
          <PublishComponentForm />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
