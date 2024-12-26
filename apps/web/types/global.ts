import { Tables } from "./supabase"

export type User = Tables<"users">

export type Component = Tables<"components">

export type Tag = Tables<"tags">

export type ComponentTag = Tables<"component_tags">

export type SortOption = "downloads" | "likes" | "date"

export type QuickFilterOption = "all" | "last_released" | "most_downloaded"

export const QUICK_FILTER_OPTIONS = {
  all: "All Components",
  last_released: "Last Released",
  most_downloaded: "Popular",
} as const

export const SORT_OPTIONS = {
  downloads: "Most downloaded",
  likes: "Most liked",
  date: "Newest",
} as const