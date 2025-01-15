import React from "react"
import { Metadata } from "next"
import { cookies } from "next/headers"

import {
  Component,
  QuickFilterOption,
  SortOption,
  User,
  Demo,
  DemoWithComponent,
} from "@/types/global"
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
  const savedSortBy = cookieStore.get("saved_sort_by")?.value as
    | SortOption
    | undefined
  const savedQuickFilter = cookieStore.get("saved_quick_filter")?.value as
    | QuickFilterOption
    | undefined

  const defaultQuickFilter = hasOnboarded ? "last_released" : "all"
  const defaultSortBy: SortOption = hasOnboarded ? "date" : "downloads"

  const sortByPreference: SortOption = savedSortBy?.length
    ? (savedSortBy as SortOption)
    : defaultSortBy
  const quickFilterPreference: QuickFilterOption = savedQuickFilter?.length
    ? (savedQuickFilter as QuickFilterOption)
    : defaultQuickFilter

  const orderByFields: [string, string] = (() => {
    switch (sortByPreference) {
      case "downloads":
        return ["component(downloads_count)", "desc"]
      case "likes":
        return ["component(likes_count)", "desc"]
      case "date":
        return ["created_at", "desc"]
    }
  })()

  const { data: initialDemos, error: demosError } =
    await supabaseWithAdminAccess
      .from("demos")
      .select(
        "*, component:components!demos_component_id_fkey(*, user:users!user_id(*))",
      )
      .limit(40)
      .order(orderByFields[0], { ascending: orderByFields[1] === "desc" })
      .returns<DemoWithComponent[]>()

  console.log("Initial demos:", initialDemos)

  if (demosError) {
    console.error("Demos error:", demosError)
    return null
  }

  const initialFilteredSortedDemos = sortComponents(
    filterComponents(
      initialDemos.map((demo) => ({
        ...demo.component,
        user: demo.component.user,
      })),
      defaultQuickFilter,
    ),
    sortByPreference,
  ).map((comp) => {
    const demo = initialDemos.find((d) => d.component_id === comp.id)
    return {
      ...demo,
      component: comp,
      user: demo?.component.user,
    }
  }) as DemoWithComponent[]

  const { data: initialTabsCountsData, error: initialTabsCountsError } =
    await supabaseWithAdminAccess.rpc("get_components_counts")

  const initialTabsCounts =
    !initialTabsCountsError && Array.isArray(initialTabsCountsData)
      ? initialTabsCountsData.reduce(
          (acc, item) => {
            acc[item.filter_type as QuickFilterOption] = item.count
            return acc
          },
          {} as Record<QuickFilterOption, number>,
        )
      : {
          all: 0,
          last_released: 0,
          most_downloaded: 0,
        }

  if (shouldShowHero) {
    return (
      <>
        <HeroSection />
        <NewsletterDialog />
      </>
    )
  }

  return (
    <>
      <Header variant="default" />
      <HomePageClient
        initialComponents={initialFilteredSortedDemos}
        initialSortBy={sortByPreference}
        initialQuickFilter={quickFilterPreference}
        initialTabsCounts={initialTabsCounts}
      />
      <NewsletterDialog />
    </>
  )
}
