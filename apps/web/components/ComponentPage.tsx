/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useEffect, useState } from "react"
import {
  ChevronRight,
  Check,
  CodeXml,
  Info,
  Link as LinkIcon,
  Pencil,
} from "lucide-react"
import { Component, Tag, User } from "@/types/global"
import { UserAvatar } from "./UserAvatar"
import Link from "next/link"
import { atom, useAtom } from "jotai"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Hotkey } from "./ui/hotkey"
import { LikeButton } from "./LikeButton"
import { useIsMobile } from "@/utils/useIsMobile"
import { ThemeToggle } from "./ThemeToggle"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { ComponentPagePreview } from "./ComponentPagePreview"
import { EditComponentDialog } from "./EditComponentDialog"
import { useUpdateComponentWithTags } from "@/utils/dbQueries"
import { toast } from "sonner"

export const isShowCodeAtom = atom(true)

export default function ComponentPage({
  component: initialComponent,
  code,
  demoCode,
  dependencies,
  demoDependencies,
  demoComponentNames,
  registryDependencies,
}: {
  component: Component & { user: User } & { tags: Tag[] }
  code: string
  demoCode: string
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  demoComponentNames: string[]
  registryDependencies: Record<string, string>
}) {
  const [component, setComponent] = useState(initialComponent)
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const { theme } = useTheme()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
      toast("Link copied to clipboard")
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
      if (
        e.code === "KeyE" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !isEditDialogOpen &&
        e.target instanceof Element &&
        !e.target.matches("input, textarea")
      ) {
        e.preventDefault()
        setIsEditDialogOpen(true)
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [isEditDialogOpen, setIsEditDialogOpen])

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

  const { mutate: updateComponent } = useUpdateComponentWithTags(supabase)

  const handleUpdate = async (
    updatedData: Partial<Component & { tags: Tag[] }>,
  ) => {
    return new Promise<void>((resolve, reject) => {
      updateComponent(
        { componentId: component.id, updatedData },
        {
          onSuccess: async () => {
            try {
              const { data: updatedComponent, error } = await supabase
                .from("components")
                .select(
                  `
                  *,
                  user:users!components_user_id_fkey(*),
                  tags:component_tags(
                    tag:tag_id(*)
                  )
                `,
                )
                .eq("id", component.id)
                .single()

              if (error) {
                console.error("Error fetching updated component:", error)
                reject(error)
              } else if (updatedComponent) {
                const transformedComponent = {
                  ...updatedComponent,
                  tags: updatedComponent.tags.map(
                    (tagRelation: any) => tagRelation.tag,
                  ),
                }

                setComponent(
                  transformedComponent as Component & { user: User } & {
                    tags: Tag[]
                  },
                )
                setIsEditDialogOpen(false)
                resolve()
              }
            } catch (err) {
              console.error("Error in onSuccess:", err)
              reject(err)
            }
          },
          onError: (error) => {
            console.error("Error updating component:", error)
            reject(error)
          },
        },
      )
    })
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg h-[98vh] w-full ${
        isMobile ? "pt-4" : "p-4"
      } bg-background text-foreground`}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <Link
            href="/"
            className="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer bg-foreground"
          />
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
          {user?.id === component.user_id && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md relative"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Pencil size={16} />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <p className="flex items-center">Edit Component</p>
              </TooltipContent>
            </Tooltip>
          )}
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
                  <span className="text-[14px] pl-1 pr-2">Code</span>
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
                  <span className="pl-1 pr-2 text-[14px]">Info</span>
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
        <ComponentPagePreview
          key={theme}
          component={component}
          code={code}
          demoCode={demoCode}
          dependencies={dependencies}
          demoDependencies={demoDependencies}
          demoComponentNames={demoComponentNames}
          registryDependencies={registryDependencies}
        />
      </div>
      <EditComponentDialog
        component={component}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
