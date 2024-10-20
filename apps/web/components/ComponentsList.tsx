"use client"

import React from "react"
import { ComponentCard } from "./ComponentCard"
import { Component, User } from "../types/global"
import { useComponents, useTagInfo } from "@/utils/dbQueries"
import { Header } from "./Header"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ComponentsList({
  initialComponents,
  isLoading,
  tagSlug,
}: {
  initialComponents?: (Component & { user: User })[] | null
  isLoading?: boolean
  tagSlug?: string
}) {
  const supabase = useClerkSupabaseClient()
  const { data: fetchedComponents } = useComponents(supabase, tagSlug)
  const { data: tagInfo } = useTagInfo(supabase, tagSlug)
  const components = initialComponents ?? fetchedComponents
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <>
      {tagSlug && <Header tagName={tagInfo?.name} page="components" />}
      <motion.div
        className={cn(
          `grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-9 list-none pb-10`,
          tagSlug ? "mt-20" : ""
        )}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        {components?.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            isLoading={isLoading}
          />
        ))}
      </motion.div>
    </>
  )
}
