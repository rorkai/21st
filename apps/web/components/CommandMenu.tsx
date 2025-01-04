"use client"

import { useState, useMemo, useEffect, Dispatch, SetStateAction } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useQuery } from "@tanstack/react-query"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { toast } from "sonner"

import { sections } from "@/lib/navigation"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { cn } from "@/lib/utils"
import { getComponentInstallPrompt } from "@/lib/prompts"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"

import { Component, User } from "@/types/global"
import { PROMPT_TYPES } from "@/types/global"

const commandSearchQueryAtom = atomWithStorage("commandMenuSearch", "")

const fetchFileTextContent = async (url: string) => {
  const filename = url.split("/").slice(-1)[0]
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Error response in fetching file ${filename}`, response)
      throw new Error(
        `Error response in fetching file ${filename}: ${response.statusText}`,
      )
    }
    return { data: await response.text(), error: null }
  } catch (err) {
    console.error(`Failed to fetch file ${filename}`, err)
    return {
      error: new Error(`Failed to fetch file ${filename}: ${err}`),
      data: null,
    }
  }
}

const useKeyboardShortcuts = ({
  selectedComponent,
  setIsCopying,
  setOpen,
  handleGeneratePrompt,
}: {
  selectedComponent: (Component & { user: User }) | undefined | null
  setIsCopying: Dispatch<SetStateAction<boolean>>
  setOpen: Dispatch<SetStateAction<boolean>>
  handleGeneratePrompt: () => void
}) => {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "x" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleGeneratePrompt()
      }
    }

    document.addEventListener("keydown", keyDownHandler)
    return () => document.removeEventListener("keydown", keyDownHandler)
  }, [selectedComponent])

  const handleKeyDown = async (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "c" && selectedComponent) {
      e.preventDefault()

      try {
        setIsCopying(true)
        const response = await fetch(selectedComponent.code)
        const code = await response.text()

        await navigator.clipboard.writeText(code)
        trackEvent(AMPLITUDE_EVENTS.COPY_CODE, {
          componentId: selectedComponent.id,
          componentName: selectedComponent.name,
          copySource: "command-menu",
        })
      } catch (err) {
        console.error("Failed to copy code:", err)
        toast.error("Failed to copy code")
      } finally {
        setTimeout(() => {
          setIsCopying(false)
          toast("Copied to clipboard")
        }, 1000)
      }
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedComponent])
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useAtom(commandSearchQueryAtom)
  const [value, setValue] = useState("")
  const router = useRouter()

  const supabase = useClerkSupabaseClient()

  const { data: components } = useQuery<(Component & { user: User })[]>({
    queryKey: ["command-menu-components", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return []

      const { data: searchResults, error } = await supabase.rpc(
        "search_components",
        {
          search_query: searchQuery,
        },
      )

      if (error) throw new Error(error.message)

      return searchResults.map((result) => {
        const component = result as unknown as Component
        return {
          ...component,
          user: result.user_data as User,
          fts: undefined,
        }
      })
    },
    refetchOnWindowFocus: false,
    retry: false,
  })

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, searchQuery])

  const selectedComponent = useMemo(() => {
    if (!value.startsWith("component-")) return null
    const [userId, componentSlug] = value.replace("component-", "").split("/")
    return components?.find(
      (c) => c.user_id === userId && c.component_slug === componentSlug,
    )
  }, [components, value])

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      setSearchQuery("")
      setValue("")
    }
  }

  const [isCopying, setIsCopying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePrompt = async () => {
    if (!selectedComponent) return

    setIsGenerating(true)
    try {
      const componentAndDemoCodePromises = [
        fetchFileTextContent(selectedComponent.code),
        fetchFileTextContent(selectedComponent.demo_code),
        selectedComponent.tailwind_config_extension
          ? fetchFileTextContent(selectedComponent.tailwind_config_extension)
          : Promise.resolve({ data: null, error: null }),
        selectedComponent.global_css_extension
          ? fetchFileTextContent(selectedComponent.global_css_extension)
          : Promise.resolve({ data: null, error: null }),
      ]

      const [
        codeResult,
        demoResult,
        tailwindConfigResult,
        globalCssResult,
        registryDependenciesResult,
      ] = await Promise.all([
        ...componentAndDemoCodePromises,
        resolveRegistryDependencyTree({
          supabase: supabase,
          sourceDependencySlugs: [
            `${selectedComponent.user.username}/${selectedComponent.component_slug}`,
          ],
          withDemoDependencies: false,
        }),
      ])

      if (
        codeResult?.error ||
        demoResult?.error ||
        tailwindConfigResult?.error ||
        globalCssResult?.error
      ) {
        throw new Error("Failed to fetch component files")
      }

      const registryDependenciesData = registryDependenciesResult?.data as {
        filesWithRegistry: Record<string, { code: string; registry: string }>
        npmDependencies: Record<string, string>
      }

      const registryDependenciesFiles = Object.fromEntries(
        Object.entries(registryDependenciesData.filesWithRegistry).map(
          ([key, value]) => [key, value.code!],
        ),
      )

      const prompt = getComponentInstallPrompt({
        promptType: PROMPT_TYPES.BASIC,
        codeFileName: selectedComponent.code.split("/").slice(-1)[0]!,
        demoCodeFileName: selectedComponent.demo_code.split("/").slice(-1)[0]!,
        code: codeResult.data as string,
        demoCode: demoResult!.data as string,
        registryDependencies: registryDependenciesFiles,
        npmDependencies: (selectedComponent.dependencies ?? {}) as Record<
          string,
          string
        >,
        npmDependenciesOfRegistryDependencies:
          registryDependenciesData.npmDependencies,
        tailwindConfig: tailwindConfigResult!.data as string,
        globalCss: globalCssResult!.data as string,
      })

      await navigator.clipboard.writeText(prompt)
      toast.dismiss("ai-prompt")
      toast.success("AI prompt copied to clipboard")

      trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
        componentId: selectedComponent.id,
        componentName: selectedComponent.name,
        promptType: PROMPT_TYPES.BASIC,
      })
    } catch (err) {
      console.error("Failed to copy AI prompt:", err)
      toast.dismiss("ai-prompt")
      toast.error("Failed to generate AI prompt")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpen = () => {
    if (value.startsWith("component-") && selectedComponent) {
      router.push(
        `/${selectedComponent.user.username}/${selectedComponent.component_slug}`,
      )
    } else if (value.startsWith("section-")) {
      const section = filteredSections
        .flatMap((section) => section.items)
        .find((item) => `section-${item.title}` === value)

      if (section) {
        router.push(section.href)
        trackEvent(AMPLITUDE_EVENTS.VIEW_SIDEBAR_SECTION, {
          itemTitle: section.title,
          path: section.href,
        })
      }
    }
    setSearchQuery("")
    setValue("")
    setOpen(false)
  }

  useKeyboardShortcuts({
    selectedComponent,
    setIsCopying,
    setOpen,
    handleGeneratePrompt,
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 max-w-3xl h-[470px] overflow-hidden"
        hideCloseButton
      >
        <Command value={value} onValueChange={setValue} className="h-full">
          <CommandInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search components or sections..."
            className="h-11 w-full"
          />
          <div className="flex h-[calc(100%-44px)]">
            <CommandList className="w-1/2 border-r overflow-y-auto">
              {filteredSections.length > 0 && (
                <CommandGroup heading="Sections">
                  {filteredSections.map((section) =>
                    section.items.map((item) => (
                      <CommandItem
                        key={item.title}
                        value={`section-${item.title}`}
                        onSelect={() => {
                          router.push(item.href)
                          setSearchQuery("")
                          setValue("")
                          setOpen(false)
                          trackEvent(AMPLITUDE_EVENTS.VIEW_SIDEBAR_SECTION, {
                            sectionTitle: section.title,
                            itemTitle: item.title,
                            path: item.href,
                          })
                        }}
                        className="flex items-center gap-2 whitespace-nowrap overflow-hidden"
                      >
                        <section.icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          in {section.title}
                        </span>
                      </CommandItem>
                    )),
                  )}
                </CommandGroup>
              )}

              {components && components.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Search results">
                    {components.map((component) => (
                      <CommandItem
                        key={component.id}
                        value={`component-${component.user_id}/${component.component_slug}`}
                        onSelect={() => {
                          router.push(
                            `/${component.user.username}/${component.component_slug}`,
                          )
                          setSearchQuery("")
                          setValue("")
                          setOpen(false)
                        }}
                        className="flex items-center gap-2"
                      >
                        <span className="truncate">{component.name}</span>
                        <span className="text-xs text-muted-foreground">
                          by {component.user.username}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              <CommandEmpty>Nothing found.</CommandEmpty>
            </CommandList>

            <div className="w-1/2 p-4 overflow-y-auto flex items-center justify-center">
              {selectedComponent && selectedComponent.preview_url && (
                <div className="rounded-md border p-4 w-full">
                  <h3 className="text-sm font-medium mb-2">
                    {selectedComponent.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {selectedComponent.description}
                  </p>
                  <div className="relative aspect-video rounded-md overflow-hidden">
                    <Image
                      src={selectedComponent.preview_url}
                      alt={`Preview of ${selectedComponent.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-border h-10 pl-4 pr-3 flex items-center justify-between bg-background text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-foreground/80" />
              <span className="text-sm font-medium">21st.dev</span>
            </div>

            <div className="flex items-center">
              {selectedComponent?.code && (
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        isGenerating && "text-muted-foreground/70",
                      )}
                    >
                      {isGenerating && (
                        <div className="h-[6px] w-[6px] rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      <button
                        onClick={handleGeneratePrompt}
                        disabled={isGenerating}
                        className="hover:bg-accent px-2 py-1 rounded-md flex items-center gap-2"
                      >
                        <span>
                          {isGenerating ? "Generating..." : "Copy Prompt"}
                        </span>
                        {!isGenerating && (
                          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-sans text-[11px] leading-none opacity-100 flex">
                            <span className="text-[11px] leading-none font-sans">
                              {navigator?.platform
                                ?.toLowerCase()
                                ?.includes("mac")
                                ? "⌘"
                                : "Ctrl"}
                            </span>
                            <span className="text-[11px] leading-none font-sans">
                              X
                            </span>
                          </kbd>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mx-2 h-4 w-[1px] bg-border" />

                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        isCopying && "text-muted-foreground/70",
                      )}
                    >
                      {isCopying && (
                        <div className="h-[6px] w-[6px] rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      <button
                        onClick={async () => {
                          try {
                            setIsCopying(true)
                            const response = await fetch(selectedComponent.code)
                            const code = await response.text()
                            await navigator.clipboard.writeText(code)
                            trackEvent(AMPLITUDE_EVENTS.COPY_CODE, {
                              componentId: selectedComponent.id,
                              componentName: selectedComponent.name,
                              copySource: "command-menu",
                            })
                          } catch (err) {
                            console.error("Failed to copy code:", err)
                            toast.error("Failed to copy code")
                          } finally {
                            setTimeout(() => {
                              setIsCopying(false)
                              toast("Copied to clipboard")
                            }, 1000)
                          }
                        }}
                        className="hover:bg-accent px-2 py-1 rounded-md flex items-center gap-2"
                      >
                        <span>{isCopying ? "Copying..." : "Copy Code"}</span>
                        {!isCopying && (
                          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-sans  text-[11px] leading-none  opacity-100 flex">
                            <span className="text-[11px] leading-none font-sans">
                              {navigator?.platform
                                ?.toLowerCase()
                                ?.includes("mac")
                                ? "⌘"
                                : "Ctrl"}
                            </span>
                            C
                          </kbd>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mx-2 h-4 w-[1px] bg-border" />
                </>
              )}

              <button
                onClick={handleOpen}
                className="flex items-center gap-2 hover:bg-accent px-2 py-1 rounded-md"
              >
                <span>Open</span>
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[11px] leading-none font-sans opacity-100 flex">
                  ⏎
                </kbd>
              </button>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
