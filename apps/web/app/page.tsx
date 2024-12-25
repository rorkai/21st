export const dynamic = "force-dynamic"

import { cookies } from "next/headers"
import { Header } from "../components/Header"
import React from "react"
import { HomePageClient } from "./page.client"
import { Metadata } from "next"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Component, User } from "@/types/global"
import { HeroSection } from "@/components/HeroSection"
import { NewsletterDialog } from "@/components/NewsletterDialog"

export const generateMetadata = async (): Promise<Metadata> => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "21st.dev - The NPM for Design Engineers",
    description: "Ship polished UI faster with ready-to-use React Tailwind components based on shadcn. Share your own components with the community.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/s/{search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return {
    title: "21st.dev - The NPM for Design Engineers",
    description:
      "Ship polished UI faster with ready-to-use React Tailwind components based on shadcn. Built by design engineers, for design engineers. Publish and share your components with the community.",
    keywords: [
      "react components",
      "tailwind css",
      "ui components",
      "design engineers",
      "component library",
      "shadcn ui",
      "publish components",
    ],
    openGraph: {
      title: "21st.dev - The NPM for Design Engineers",
      description:
        "Ship polished UI faster. Built by design engineers, for design engineers. Share your components with the community.",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "21st.dev - The NPM for Design Engineers",
      description:
        "Ship polished UI faster. Built by design engineers, for design engineers. Share your components with the community.",
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  }
}

export default async function HomePage() {
  const {
    data: initialComponents,
    count: componentsCount,
    error: componentsError,
  } = await supabaseWithAdminAccess
    .from("components")
    .select("*, user:users!user_id (*)", { count: "exact" })
    .limit(40)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .returns<(Component & { user: User })[]>()

  if (componentsError) {
    return null
  }

  const cookieStore = cookies()
  const isReturning = cookieStore.has("has_visited")

  if (!isReturning) {
    return (
      <>
        <HeroSection />
        <NewsletterDialog />
      </>
    )
  }

  return (
    <>
      <Header page="home" />
      <HomePageClient
        initialComponents={initialComponents}
        componentsTotalCount={componentsCount ?? 0}
      />
      <NewsletterDialog />
    </>
  )
}
