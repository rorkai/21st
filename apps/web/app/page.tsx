import { Header } from "../components/Header"
import React from "react"
import { HomePageClient } from "./page.client"
import { Metadata } from "next"
import Head from "next/head"
import { supabaseWithAdminAccess } from "@/utils/supabase"
import { Component, User } from "@/types/global"

export const metadata: Metadata = {
  title: "Home | 21st.dev",
  description: "Discover and share code components with the community.",
}

export default async function HomePage() {
  const { data: initialComponents, error: componentsError } =
    await supabaseWithAdminAccess
      .from("components")
      .select("*, user:users!user_id (*)")
      .limit(40)
      .eq("is_public", true)
      .returns<(Component & { user: User })[]>()

  if (componentsError) {
    return null
  }

  return (
    <>
      <Head>
        <title>Home | 21st.dev</title>
      </Head>
      <Header page="home" />
      <div className="container mx-auto mt-20">
        <HomePageClient initialComponents={initialComponents} />
      </div>
    </>
  )
}
