import { Tables } from "./supabase"

export type User = Tables<"users">

export type Component = Tables<"components">

export type Tag = Tables<"tags">

export type Demo = Tables<"demos">

export type DemoWithComponent = Demo & {
  component: Component
  user: User
}

export type DemoWithUser = Demo & {
  user: User
}

export type DemoTag = Tables<"demo_tags">

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
  SITEBREW: "sitebrew",
  V0: "v0",
  LOVABLE: "lovable",
  BOLT: "bolt",
  EXTENDED: "extended",
} as const

export type PromptType = (typeof PROMPT_TYPES)[keyof typeof PROMPT_TYPES]

export type ComponentWithUser = Component & { user: User }

// Define activity types enum
export enum AnalyticsActivityType {
  COMPONENT_VIEW = "component_view",
  COMPONENT_CODE_COPY = "component_code_copy",
  COMPONENT_PROMPT_COPY = "component_prompt_copy",
  COMPONENT_CLI_DOWNLOAD = "component_cli_download",
}

export type FormStep =
  | "nameSlugForm"
  | "code"
  | "demoCode"
  | "demoDetails"
  | "detailedForm"
