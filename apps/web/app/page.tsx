"use client"

import { Header } from "../components/Header"
import React from "react"
import { ComponentsList } from "../components/ComponentsList"
import { useComponents } from "@/utils/dataFetchers"

export default function HomePage() {
  const { data: components, isLoading } = useComponents()
  
  return (
    <>
      <Header />
      <div className="container mx-auto mt-7">
        <ComponentsList initialComponents={components || []} />
      </div>
    </>
  )
}
