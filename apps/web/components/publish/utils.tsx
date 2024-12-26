import { UseFormReturn } from "react-hook-form"
import { z } from "zod"

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
  registry: z.string().default("ui"),
  publish_as_username: z.string().optional(),
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
  preview_image_data_url: z.string().optional(),
  preview_image_file: z.instanceof(File).optional(),
  preview_video_data_url: z.string().optional(),
  preview_video_file: z.instanceof(File).optional(),
  license: z.string().optional(),
  unknown_dependencies: z.array(
    z.object({
      slugWithUsername: z.string(),
      registry: z.string(),
      isDemoDependency: z.boolean(),
    }),
  ),
  direct_registry_dependencies: z.array(z.string()),
  demo_direct_registry_dependencies: z.array(z.string()),
  slug_available: z.boolean().optional(),
  website_url: z.string().optional(),
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

export const isFormValid = (form: UseFormReturn<FormData>) => {
  const {
    name,
    component_slug,
    code,
    demo_code,
    slug_available,
    unknown_dependencies,
  } = form.getValues()

  return (
    name.length >= 2 &&
    component_slug.length >= 2 &&
    code.length > 0 &&
    demo_code.length > 0 &&
    unknown_dependencies?.length === 0 &&
    slug_available === true
  )
}
