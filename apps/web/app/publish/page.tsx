import React from "react"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import ComponentForm from "@/components/ComponentForm/ComponentForm"

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
