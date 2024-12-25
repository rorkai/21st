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

export const metadata: Metadata = {
  title: "Home | 21st.dev",
  description: "Discover and share code components with the community.",
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
