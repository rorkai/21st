import React from "react"
import { Metadata } from "next"
import { cookies } from "next/headers"

import { Component, SortOption, User } from "@/types/global"
import { Tables } from "@/types/supabase"

import { supabaseWithAdminAccess } from "@/lib/supabase"
import { filterComponents, sortComponents } from "@/lib/filters.client"

import { Header } from "../components/Header"
import { HeroSection } from "@/components/HeroSection"
import { NewsletterDialog } from "@/components/NewsletterDialog"
import { HomePageClient } from "./page.client"

export const dynamic = "force-dynamic"

export const generateMetadata = async (): Promise<Metadata> => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "21st.dev - The NPM for Design Engineers",
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/s/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return {
    title: "21st.dev – The NPM for Design Engineers",
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
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
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
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
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  }
}

export default async function HomePage() {
  const cookieStore = cookies()
  const shouldShowHero = !cookieStore.has("has_visited")
  const hasOnboarded = cookieStore.has("has_onboarded")
  // const defaultSortBy = hasOnboarded ? "likes" : "downloads"
  const defaultQuickFilter = hasOnboarded ? "last_released" : "all"
  const defaultSortBy = "downloads"

  const sortByPreference: SortOption =
    (cookieStore.get("sort_by")?.value as SortOption) ?? defaultSortBy
  const orderByFields: [keyof Tables<"components">, { ascending: boolean }] =
    (() => {
      switch (sortByPreference) {
        case "downloads":
          return ["downloads_count", { ascending: false }]
        case "likes":
          return ["likes_count", { ascending: false }]
        case "date":
          return ["created_at", { ascending: false }]
      }
    })()

  const {
    data: allComponents,
    count: componentsCount,
    error: componentsError,
  } = await supabaseWithAdminAccess
    .from("components")
    .select("*, user:users!user_id (*)", { count: "exact" })
    .limit(40)
    .eq("is_public", true)
    .order(...orderByFields)
    .returns<(Component & { user: User })[]>()

  if (componentsError) {
    return null
  }

  if (shouldShowHero) {
    return (
      <>
        <HeroSection />
        <NewsletterDialog />
      </>
    )
  }

  const initialComponents = sortComponents(
    filterComponents(allComponents, defaultQuickFilter),
    sortByPreference,
  )

  return (
    <>
      <Header page="home" />
      <HomePageClient
        initialComponents={initialComponents}
        initialSortBy={sortByPreference}
        initialQuickFilter={defaultQuickFilter}
        componentsTotalCount={componentsCount ?? 0}
      />
      <NewsletterDialog />
    </>
  )
}
