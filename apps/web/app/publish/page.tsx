import React from "react"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import PublishComponentForm from "@/components/publish/PublishComponentForm"

import Head from "next/head"
import { Header } from "@/components/Header"

export default function PublishPage() {
  return (
    <>
      <Head>
        <title>Publish New Component | Component Library</title>
      </Head>
      <SignedIn>
        <Header page="publish" />
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
