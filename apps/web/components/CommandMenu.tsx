"use client"

import * as React from "react"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { sections } from "@/config/navigation"
import { Component, User } from "@/types/global"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const commandSearchQueryAtom = atomWithStorage("commandMenuSearch", "")

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = useAtom(commandSearchQueryAtom)
  const [value, setValue] = React.useState("")
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

      return searchResults.map((result) => ({
        ...result,
        user: result.user_data as User,
        fts: undefined,
      })) as (Component & { user: User })[]
    },
    refetchOnWindowFocus: false,
    retry: false,
  })

  const filteredSections = React.useMemo(() => {
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

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const selectedComponent = React.useMemo(() => {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 max-w-3xl h-[470px] overflow-hidden">
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
        </Command>
      </DialogContent>
    </Dialog>
  )
}
