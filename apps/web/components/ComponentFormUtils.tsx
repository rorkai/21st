import { atom } from "jotai"
import { z } from "zod"
import {
  extractComponentNames,
  extractDemoComponentName,
  extractDependencies,
} from "@/utils/parsers"

export const demoCodeErrorAtom = atom<string | null>(null)
export const parsedDependenciesAtom = atom<Record<string, string>>({})
export const parsedComponentNamesAtom = atom<string[]>([])
export const parsedDemoDependenciesAtom = atom<Record<string, string>>({})
export const internalDependenciesAtom = atom<Record<string, string>>({})
export const importsToRemoveAtom = atom<string[]>([])
export const parsedDemoComponentNameAtom = atom<string>("")

export const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  component_slug: z.string().min(2, {
    message: "Slug must be at least 2 characters.",
  }),
  code: z.string().min(1, {
    message: "Component code is required.",
  }),
  demo_code: z.string().min(1, {
    message: "Demo code is required.",
  }),
  description: z.string().optional(),
  tags: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        slug: z.string(),
      }),
    )
    .optional()
    .default([]),
  is_public: z.boolean().default(true),
  preview_url: z.instanceof(File).optional(),
})

export type FormData = z.infer<typeof formSchema>

export interface TagOption {
  value: number
  label: string
  __isNew__?: boolean
}

export const formatComponentName = (name: string): string => {
  return name.replace(/([A-Z])/g, " $1").trim()
}

export function prepareFilesForPreview(code: string, demoCode: string) {
  const files = {
    "/App.tsx": demoCode,
    "/Component.tsx": code,
  }

  const dependencies = {
    ...extractDependencies(code),
    ...extractDependencies(demoCode),
  }

  return { files, dependencies }
}

export const isFormValid = (
  form: any,
  demoCodeError: string | null,
  internalDependencies: Record<string, string>,
  slugAvailable: boolean | null,
  isSlugManuallyEdited: boolean,
) => {
  const { name, component_slug, code, demo_code } = form.getValues()
  return (
    name.length >= 2 &&
    component_slug.length >= 2 &&
    code.length > 0 &&
    demo_code.length > 0 &&
    !demoCodeError &&
    Object.values(internalDependencies).every((slug) => slug) &&
    (slugAvailable === true || !isSlugManuallyEdited)
  )
}
