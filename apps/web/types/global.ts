import { Database } from "./supabase"
import type { Json } from "./supabase"

export type Component = Database["public"]["Tables"]["components"]["Row"]
export type Demo = Database["public"]["Tables"]["demos"]["Row"]
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Tag = Database["public"]["Tables"]["tags"]["Row"]

export type DemoWithComponent = Demo & {
  component: Component & { user: User }
  tags: Tag[]
}

export type DemoWithTags = Demo & {
  tags: Tag[]
  user: User
}

export type DemoWithComponentAndTags = DemoWithComponent & {
  tags: Tag[]
}

export type DemoTag = Database["public"]["Tables"]["demo_tags"]["Row"]

export type ComponentTag = Database["public"]["Tables"]["component_tags"]["Row"]

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
