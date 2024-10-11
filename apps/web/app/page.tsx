"use client"

import { Header } from "../components/Header"
import React from "react"
import { ComponentsList } from "../components/ComponentsList"
import { useComponents } from "@/utils/dataFetchers"
import { Metadata } from "next"
import Head from "next/head"

export default function HomePage() {
  const { data: components, isLoading } = useComponents()
  // eslint-disable-next-line no-unused-vars

  const metadata: Metadata = {
    title: "Home | Component Community",
    description: "Discover and share code components with the community.",
  }

  return (
    <>
      <Head>
        <title>Home | Component Community</title>
      </Head>
      <Header />
      <div className="container mx-auto mt-20">
        <ComponentsList components={components || []} isLoading={isLoading} />
      </div>
    </>
  )
}
