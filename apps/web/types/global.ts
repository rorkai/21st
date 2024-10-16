import { Tables } from "./supabase"

export type User = Tables<"users">

export type Component = Tables<"components">

export type Tag = Tables<"tags">

export type ComponentTag = Tables<"component_tags">
