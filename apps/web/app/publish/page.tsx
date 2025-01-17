import React from "react"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import PublishComponentForm from "@/components/features/publish/publish-layout"

import Head from "next/head"
import { Header } from "@/components/ui/header.client"

export default function PublishPage() {
  return (
    <>
      <Head>
        <title>Publish New Component | Component Library</title>
      </Head>
      <SignedIn>
        <Header variant="publish" />
        <div className="flex flex-row items-center h-screen w-full">
          <PublishComponentForm />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
