/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import {
  ChevronRight,
  Check,
  CodeXml,
  Info,
  Link as LinkIcon,
} from "lucide-react"
import { Component } from "@/types/types"
import { UserAvatar } from "./UserAvatar"
import Link from "next/link"
import { atom, useAtom } from "jotai"
import { motion } from "framer-motion"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Hotkey } from "./ui/hotkey"
import { LikeButton } from "./LikeButton"
import { useIsMobile } from "@/utils/useMediaQuery"
import { generateFiles } from "@/utils/generateFiles"
import { useTheme } from "next-themes"
import { ThemeToggle } from "./ThemeToggle"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs"

export const isShowCodeAtom = atom(true)

const ComponentPreview = dynamic(() => import("./ComponentPreview"), {
  ssr: false,
  loading: () => null,
})

export default function ComponentPage({
  component,
  code,
  demoCode,
  dependencies,
  demoDependencies,
  demoComponentName,
  internalDependencies,
}: {
  component: Component
  code: string
  demoCode: string
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  demoComponentName: string
  internalDependencies: Record<string, string>
}) {
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"
  const files = generateFiles({
    demoComponentName,
    componentSlug: component.component_slug,
    code,
    demoCode,
    theme: isDarkTheme ? "dark" : "light",
  })

  const { data: liked } = useQuery({
    queryKey: ["hasUserLikedComponent", component.id, user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null
      const { data, error } = await supabase
        .from("component_likes")
        .select("*")
        .eq("component_id", component.id)
        .eq("user_id", user?.id)
      if (error) {
        console.error("Error checking if user liked component:", error)
        throw error
      }
      return data.length > 0
    },
  })

  const [isShared, setIsShared] = useState(false)
  const [isShowCode, setIsShowCode] = useAtom(isShowCodeAtom)
  const isMobile = useIsMobile()
  const handleShareClick = async () => {
    const url = `${window.location.origin}/${component.user.username}/${component.component_slug}`
    try {
      await navigator.clipboard.writeText(url)
      setIsShared(true)
      setTimeout(() => {
        setIsShared(false)
      }, 2000)
    } catch (err) {
      console.error("Error copying link: ", err)
    }
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "BracketRight") {
        e.preventDefault()
        setIsShowCode(false)
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [])

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "BracketLeft") {
        e.preventDefault()
        setIsShowCode(true)
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [])

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "C" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleShareClick()
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [])

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg h-[98vh] w-full ${
        isMobile ? "pt-4" : "p-4"
      } bg-background text-foreground`}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <motion.div
            layoutId="logo"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Link
              href="/"
              className="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer"
            >
              <div className="w-full h-full rounded-full bg-foreground" />
            </Link>
          </motion.div>
          <ChevronRight size={12} className="text-muted-foreground" />
          <Link
            href={`/${component.user.username}`}
            className="cursor-pointer flex items-center whitespace-nowrap"
          >
            <UserAvatar
              src={component.user.image_url || "/placeholder.svg"}
              alt={component.user.name}
              size={20}
              isClickable={true}
            />
          </Link>
          <ChevronRight size={12} className="text-muted-foreground" />
          <div className="flex gap-2 items-start">
            <p className="text-[14px] font-medium whitespace-nowrap">
              {component.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignedIn>
            <LikeButton
              componentId={component.id}
              size={18}
              showTooltip={true}
              liked={liked ?? false}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <LikeButton componentId={component.id} size={18} liked={false} />
            </SignInButton>
          </SignedOut>
          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleShareClick}
                  disabled={isShared}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md relative"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isShared ? <Check size={16} /> : <LinkIcon size={16} />}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <p className="flex items-center">
                  {isShared ? "Link copied" : "Copy link"}
                  <Hotkey keys={["⌘", "⇧", "C"]} />
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="relative bg-muted rounded-lg h-8 p-0.5 flex">
            <div
              className="absolute inset-y-0.5 rounded-md bg-background shadow transition-all duration-200 ease-in-out"
              style={{
                width: "calc(50% - 2px)",
                left: isShowCode ? "2px" : "calc(50%)",
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsShowCode(true)}
                  className={`relative z-2 px-2 flex items-center justify-center transition-colors duration-200 ${
                    isShowCode ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <CodeXml size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <p className="flex items-center">
                  Component code
                  <Hotkey keys={["["]} />
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsShowCode(false)}
                  className={`relative z-2s px-2 flex items-center justify-center transition-colors duration-200 ${
                    !isShowCode ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Info size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <p className="flex items-center">
                  Component info
                  <Hotkey keys={["]"]} />
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className="flex w-full !flex-grow">
        <ComponentPreview
          key={theme}
          files={files}
          dependencies={dependencies}
          demoDependencies={demoDependencies}
          demoComponentName={demoComponentName}
          internalDependencies={internalDependencies}
          componentSlug={component.component_slug}
          componentInfo={component}
        />
      </div>
    </div>
  )
}
