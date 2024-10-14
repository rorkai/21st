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
import { atom, useAtom } from "jotai"
import Image from "next/image"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Hotkey } from "./ui/hotkey"
import { LikeButton } from "./LikeButton"
import { useIsMobile } from "@/utils/useMediaQuery"

export const isShowCodeAtom = atom(true)

const ComponentPreview = dynamic(() => import("./ComponentPreview"), {
  ssr: false,
  loading: () => null,
})

export default function ComponentPage({
  component,
  files,
  dependencies,
  demoDependencies,
  demoComponentName,
  internalDependencies,
}: {
  component: Component
  files: Record<string, string>
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  demoComponentName: string
  internalDependencies: Record<string, string>
}) {
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
      className={`flex flex-col gap-2 rounded-lg h-[98vh] w-full ${isMobile ? "pt-4" : "p-4"}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <motion.div
            layoutId="logo"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Link
              href="/"
              className="flex min-w-[20px] min-h-[20px] items-center cursor-pointer"
            >
              <Image
                src="/cc-logo-circle.svg"
                alt="Logo"
                width={20}
                height={20}
                sizes="(min-height: 20px) 100vw, (min-width: 20px) 100vw, 100vh"
              />
            </Link>
          </motion.div>
          <ChevronRight size={12} className="text-gray-500" />
          <a
            href={`/${component.user.username}`}
            className="cursor-pointer flex items-center whitespace-nowrap"
          >
            <UserAvatar
              src={component.user.image_url || "/placeholder.svg"}
              alt={component.user.name}
              size={20}
              isClickable={true}
            />
          </a>
          <ChevronRight size={12} className="text-gray-500" />
          <div className="flex gap-2 items-start">
            <p className="text-[14px] font-medium whitespace-nowrap">
              {component.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <LikeButton componentId={component.id} size={20} showTooltip={true} />
          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleShareClick}
                  disabled={isShared}
                  className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-md relative"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isShared ? <Check size={18} /> : <LinkIcon size={18} />}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isShared ? "Link copied" : "Copy link"}
                  <Hotkey keys={["⌘", "⇧", "C"]} isDarkBackground={true} />
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="relative bg-gray-200 rounded-lg h-8 p-0.5 flex">
            <div
              className="absolute inset-y-0.5 rounded-md bg-white shadow transition-all duration-200 ease-in-out"
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
                    isShowCode ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  <CodeXml size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Component code
                  <Hotkey keys={["["]} isDarkBackground={true} />
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsShowCode(false)}
                  className={`relative z-2s px-2 flex items-center justify-center transition-colors duration-200 ${
                    !isShowCode ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  <Info size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Component info
                  <Hotkey keys={["]"]} isDarkBackground={true} />
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className="flex w-full !flex-grow">
        <ComponentPreview
          files={files}
          dependencies={dependencies}
          demoDependencies={demoDependencies}
          demoComponentName={demoComponentName}
          internalDependencies={internalDependencies}
          installUrl={component.install_url}
          componentSlug={component.component_slug}
          componentInfo={component}
        />
      </div>
    </div>
  )
}
