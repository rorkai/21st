import { Tables, Database } from "./supabase"

export type User = Tables<"users">

export type Component = Tables<"components">

export type Tag = Tables<"tags">

export type ComponentTag = Tables<"component_tags">

export type SortOption = "downloads" | "likes" | "date"

export type QuickFilterOption = "all" | "last_released" | "most_downloaded"

export const QUICK_FILTER_OPTIONS = {
  all: "All Components",
  last_released: "Latest",
  most_downloaded: "Popular",
} as const

export const SORT_OPTIONS = {
  downloads: "Most downloaded",
  likes: "Most liked",
  date: "Newest",
} as const

export const PROMPT_TYPES = {
  BASIC: "basic",
  V0: "v0",
  LOVABLE: "lovable",
  BOLT: "bolt",
  EXTENDED: "extended",
} as const

export type PromptType = (typeof PROMPT_TYPES)[keyof typeof PROMPT_TYPES]

export type GetFilteredComponentsResponse =
  Database["public"]["Functions"]["get_filtered_components"]["Returns"]
export type GetFilteredComponentsArgs =
  Database["public"]["Functions"]["get_filtered_components"]["Args"]
export type SearchComponentsResponse =
  Database["public"]["Functions"]["search_components"]["Returns"]
export type SearchComponentsArgs =
  Database["public"]["Functions"]["search_components"]["Args"]

export interface ComponentCount {
  filter_type: string
  count: number
}

export type GetComponentsCountsResponse = ComponentCount[]
export type GetComponentsCountsArgs = {
  p_sort_by: string
}

export type ComponentWithUser = Component & { user: User }
export type FilteredComponent =
  Database["public"]["Functions"]["get_filtered_components"]["Returns"][number]
export type SearchComponent =
    Database["public"]["Functions"]["search_components"]["Returns"][number]