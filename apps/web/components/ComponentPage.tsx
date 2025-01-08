"use client"

import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { atom, useAtom } from "jotai"
import { useQuery } from "@tanstack/react-query"
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs"

import { Component, Tag, User } from "@/types/global"
import { PromptType, PROMPT_TYPES } from "@/types/global"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUpdateComponentWithTags } from "@/lib/queries"
import {
  identifyUser,
  trackPageProperties,
  trackEvent,
  AMPLITUDE_EVENTS,
} from "@/lib/amplitude"
import {
  getComponentInstallPrompt,
  formatV0Prompt,
  promptOptions,
  type PromptOptionBase,
} from "@/lib/prompts"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "./UserAvatar"
import { LikeButton } from "./LikeButton"
import { ThemeToggle } from "./ThemeToggle"
import { ComponentPagePreview } from "./ComponentPagePreview"
import { EditComponentDialog } from "./EditComponentDialog"
import { usePublishAs } from "./publish/use-publish-as"
import { Icons } from "@/components/icons"

import { ChevronRight, CodeXml, Info, Pencil, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { atomWithStorage } from "jotai/utils"

export const isShowCodeAtom = atom(true)
const selectedPromptTypeAtom = atomWithStorage<PromptType | "v0-open">(
  "selectedPromptType",
  PROMPT_TYPES.BASIC,
)

const useAnalytics = ({
  component,
  user,
}: {
  component: Component & { user: User; tags: Tag[] }
  user: ReturnType<typeof useUser>["user"]
}) => {
  useEffect(() => {
    trackPageProperties({
      componentId: component.id,
      componentName: component.name,
      authorId: component.user.id,
      isPublic: component.is_public,
      tags: component.tags.map((tag) => tag.name),
      downloadsCount: component.downloads_count,
      hasDemo: !!component.demo_code,
      deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }, [component.id])

  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        username: user.username,
        created_at: user.createdAt,
        is_admin: user.publicMetadata?.isAdmin || false,
      })
    }
  }, [user])
}

const useKeyboardShortcuts = ({
  component,
  setIsShowCode,
  canEdit,
  isEditDialogOpen,
  setIsEditDialogOpen,
  handlePromptAction,
}: {
  component: Component & { user: User }
  setIsShowCode: Dispatch<SetStateAction<boolean>>
  canEdit: boolean
  isEditDialogOpen: boolean
  setIsEditDialogOpen: Dispatch<SetStateAction<boolean>>
  handlePromptAction: () => void
}) => {
  const handleShareClick = async () => {
    if (typeof window === "undefined") return

    const url = `${window.location.origin}/${component.user.username}/${component.component_slug}`
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        trackEvent(AMPLITUDE_EVENTS.SHARE_COMPONENT, {
          componentId: component.id,
          componentName: component.name,
          url,
        })
        toast("Link copied to clipboard")
      }
    } catch (err) {
      console.error("Error copying link: ", err)
    }
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "BracketRight") {
        e.preventDefault()
        setIsShowCode(false)
        trackEvent(AMPLITUDE_EVENTS.TOGGLE_CODE_VIEW, {
          componentId: component.id,
          view: "info",
        })
      }
      if (e.code === "BracketLeft") {
        e.preventDefault()
        setIsShowCode(true)
        trackEvent(AMPLITUDE_EVENTS.TOGGLE_CODE_VIEW, {
          componentId: component.id,
          view: "code",
        })
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => window.removeEventListener("keydown", keyDownHandler)
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
        canEdit &&
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
  }, [isEditDialogOpen, setIsEditDialogOpen, canEdit])

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "KeyX" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handlePromptAction()
      }
    }

    document.addEventListener("keydown", keyDownHandler)
    return () => document.removeEventListener("keydown", keyDownHandler)
  }, [handlePromptAction])

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "KeyC" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleShareClick()
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => window.removeEventListener("keydown", keyDownHandler)
  }, [])
}

const copyToClipboard = async (text: string) => {
  if (typeof window === "undefined") {
    return // Skip execution on server
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    // Fallback for Safari
    const type = "text/plain"
    const blob = new Blob([text], { type })
    const data = [new ClipboardItem({ [type]: blob })]

    if (navigator?.clipboard?.write) {
      await navigator.clipboard.write(data)
      return
    }

    // Fallback using document
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    textarea.style.whiteSpace = "pre"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
  } catch (err) {
    throw new Error("Failed to copy text")
  }
}

export default function ComponentPage({
  component: initialComponent,
  code,
  demoCode,
  dependencies,
  demoDependencies,
  demoComponentNames,
  registryDependencies,
  npmDependenciesOfRegistryDependencies,
  tailwindConfig,
  globalCss,
  compiledCss,
}: {
  component: Component & { user: User } & { tags: Tag[] }
  code: string
  demoCode: string
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  demoComponentNames: string[]
  registryDependencies: Record<string, string>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  tailwindConfig?: string
  globalCss?: string
  compiledCss?: string
}) {
  const [component, setComponent] = useState(initialComponent)
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const { theme } = useTheme()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { isAdmin } = usePublishAs({ username: user?.username ?? "" })

  const canEdit = user?.id === component.user_id || isAdmin

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

  const [isShowCode, setIsShowCode] = useAtom(isShowCodeAtom)

  const [selectedPromptType, setSelectedPromptType] = useAtom(
    selectedPromptTypeAtom,
  )

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

  const handleEditClick = () => {
    setIsEditDialogOpen(true)
    trackEvent(AMPLITUDE_EVENTS.EDIT_COMPONENT, {
      componentId: component.id,
      componentName: component.name,
      userId: user?.id,
    })
  }

  const handlePromptAction = async () => {
    const selectedOption = promptOptions.find(
      (opt) => opt.id === selectedPromptType || opt.id === "v0-open",
    )

    if (selectedOption?.id === "v0-open") {
      const formattedPrompt = formatV0Prompt(component.name, code)
      const encodedPrompt = encodeURIComponent(formattedPrompt)
      window.open(`https://v0.dev/?q=${encodedPrompt}`, "_blank")

      trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
        componentId: component.id,
        componentName: component.name,
        promptType: selectedOption.id,
        action: "open",
        destination: "v0.dev",
      })
      return
    }

    try {
      const prompt = getComponentInstallPrompt({
        promptType: selectedPromptType as PromptType,
        codeFileName: component.code.split("/").slice(-1)[0]!,
        demoCodeFileName: component.demo_code.split("/").slice(-1)[0]!,
        code,
        demoCode,
        registryDependencies,
        npmDependencies: dependencies,
        npmDependenciesOfRegistryDependencies,
        tailwindConfig,
        globalCss,
      })

      await copyToClipboard(prompt)
      toast.success("AI prompt copied to clipboard")

      trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
        componentId: component.id,
        componentName: component.name,
        promptType: selectedPromptType as PromptType,
        action: "copy",
        destination:
          selectedOption?.id === PROMPT_TYPES.V0
            ? "v0"
            : selectedOption?.id === PROMPT_TYPES.LOVABLE
              ? "lovable"
              : selectedOption?.id === PROMPT_TYPES.BOLT
                ? "bolt"
                : "other",
      })
    } catch (err) {
      console.error("Failed to copy AI prompt:", err)
      toast.error("Failed to generate AI prompt")
    }
  }

  useAnalytics({
    component,
    user,
  })

  useKeyboardShortcuts({
    component,
    canEdit,
    setIsShowCode,
    isEditDialogOpen,
    setIsEditDialogOpen,
    handlePromptAction,
  })

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg h-[98vh] w-full py-4 bg-background text-foreground`}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer bg-foreground"
              />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            >
              <p className="flex items-center gap-1.5">Back to homepage</p>
            </TooltipContent>
          </Tooltip>
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
              user={component.user}
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
          <ThemeToggle fillIcon={false} />
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleEditClick}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md relative"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Pencil size={16} />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <p className="flex items-center gap-1.5">
                  Edit Component
                  <kbd className="pointer-events-none text-muted-foreground h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                    E
                  </kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <SignedIn>
            <LikeButton
              componentId={component.id}
              componentLikesCount={component.likes_count}
              size={18}
              showTooltip={true}
              liked={liked ?? false}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <LikeButton
                componentId={component.id}
                componentLikesCount={component.likes_count}
                size={18}
                liked={false}
              />
            </SignInButton>
          </SignedOut>

          <div className="hidden md:flex items-center gap-1">
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
                  <p className="flex items-center gap-1.5">
                    Component code
                    <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                      [
                    </kbd>
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsShowCode(false)}
                    className={`relative z-2 px-2 flex items-center justify-center transition-colors duration-200 ${
                      !isShowCode ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Info size={18} />
                    <span className="pl-1 pr-2 text-[14px]">Info</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                  <p className="flex items-center gap-1.5">
                    Component info
                    <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                      ]
                    </kbd>
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-lg shadow-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handlePromptAction}
                    className="rounded-none shadow-none first:rounded-s-lg focus-visible:z-10"
                  >
                    {selectedPromptType === "v0-open" ? (
                      <>
                        <span className="mr-2">Open in</span>
                        <div className="flex items-center justify-center w-[18px] h-[18px]">
                          <Icons.v0Logo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-[22px] h-[22px]">
                            {
                              promptOptions.find(
                                (opt): opt is PromptOptionBase =>
                                  opt.type === "option" &&
                                  opt.id === selectedPromptType,
                              )?.icon
                            }
                          </div>
                          <span>Copy prompt</span>
                        </div>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                  <p className="flex items-center gap-1.5">
                    {selectedPromptType === "v0-open"
                      ? "Open in v0"
                      : "Copy AI prompt"}
                    <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 font-sans text-[11px] leading-none opacity-100 flex">
                      <span className="text-[11px] leading-none font-sans text-muted-foreground">
                        {navigator?.platform?.toLowerCase()?.includes("mac")
                          ? "⌘"
                          : "Ctrl"}
                      </span>
                      <span className="text-[11px] leading-none font-sans text-muted-foreground">
                        X
                      </span>
                    </kbd>
                  </p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="rounded-none shadow-none last:rounded-e-lg focus-visible:z-10"
                    size="icon"
                  >
                    <ChevronDown size={16} strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64"
                  side="bottom"
                  sideOffset={4}
                  align="end"
                >
                  <DropdownMenuRadioGroup
                    value={selectedPromptType}
                    onValueChange={(value) =>
                      setSelectedPromptType(value as PromptType | "v0-open")
                    }
                  >
                    <DropdownMenuLabel>Copy prompt</DropdownMenuLabel>
                    {promptOptions.map((option) => {
                      if (option.type === "separator") {
                        return (
                          <>
                            <DropdownMenuSeparator key={option.id} />
                            <DropdownMenuLabel>
                              {option.id === "separator1"
                                ? "Copy optimized prompt"
                                : "Open in AI editor"}
                            </DropdownMenuLabel>
                          </>
                        )
                      }

                      return (
                        <DropdownMenuRadioItem
                          key={option.id}
                          value={option.id}
                          className="items-start [&>span]:pt-1"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-[22px] h-[22px]">
                              {option.icon}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">
                                {option.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </div>
                        </DropdownMenuRadioItem>
                      )
                    })}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
          npmDependenciesOfRegistryDependencies={
            npmDependenciesOfRegistryDependencies
          }
          tailwindConfig={tailwindConfig}
          globalCss={globalCss}
          compiledCss={compiledCss}
          canEdit={canEdit}
          setIsEditDialogOpen={setIsEditDialogOpen}
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
