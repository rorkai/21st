import { Tables } from "./supabase"

export type User = Tables<"users">

export type Component = Tables<"components">

export type Tag = Tables<"tags">

export type ComponentTag = Tables<"component_tags">

export type SortOption = "installations" | "popular" | "newest"

export type QuickFilterOption = "all" | "recent" | "downloaded"

export const QUICK_FILTER_OPTIONS = {
  all: "All Components",
  recent: "Last Released",
  downloaded: "Most Used",
} as const

export const SORT_OPTIONS = {
  installations: "Most downloaded",
  popular: "Most liked",
  newest: "Newest",
} as const
