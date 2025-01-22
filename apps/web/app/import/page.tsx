import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import Head from "next/head"
import { Header } from "@/components/ui/header.client"
import ImportPageClient from "./page.client"

export default function ImportPage() {
  return (
    <>
      <Head>
        <title>Import Component | Component Library</title>
      </Head>
      <SignedIn>
        <Header variant="publish" />
        <div className="flex flex-row items-center h-screen w-full">
          <ImportPageClient />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
