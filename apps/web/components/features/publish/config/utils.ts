import { UseFormReturn } from "react-hook-form"
import { z } from "zod"

const demoSchema = z.object({
  name: z.string().min(2, {
    message: "Demo name must be at least 2 characters.",
  }),
  demo_code: z.string().min(1, {
    message: "Demo code is required.",
  }),
  demo_slug: z.string().min(1, {
    message: "Demo slug is required.",
  }),
  preview_image_data_url: z.string({
    required_error: "Preview image is required.",
  }),
  preview_image_file: z.instanceof(File, {
    message: "Preview image file is required.",
  }),
  preview_video_data_url: z.string().optional(),
  preview_video_file: z.instanceof(File).optional(),
  tags: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        slug: z.string(),
      }),
    )
    .min(1, {
      message: "At least one tag is required.",
    }),
  demo_direct_registry_dependencies: z.array(z.string()).default([]),
  demo_dependencies: z.record(z.string()).default({}),
  tailwind_config: z.string().optional(),
  global_css: z.string().optional(),
})

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
  demos: z.array(demoSchema).default([]),
  description: z.string().optional(),
  license: z.string(),
  website_url: z.string().optional(),
  is_public: z.boolean(),
  unknown_dependencies: z.array(z.string()).default([]),
  unknown_dependencies_with_metadata: z
    .array(
      z.object({
        slugWithUsername: z.string(),
        registry: z.string(),
        isDemoDependency: z.boolean(),
      }),
    )
    .default([]),
  direct_registry_dependencies: z.array(z.string()).default([]),
  registry: z.string(),
  publish_as_username: z.string().optional(),
  slug_available: z.boolean().optional(),
  tailwind_config: z.string().optional(),
  globals_css: z.string().optional(),
})

export type FormData = z.infer<typeof formSchema>

export type DemoFormData = z.infer<typeof demoSchema>

export interface TagOption {
  value: number
  label: string
  __isNew__?: boolean
}

export const formatComponentName = (name: string): string => {
  return name.replace(/([A-Z])/g, " $1").trim()
}

export const isFormValid = (form: UseFormReturn<FormData>): boolean => {
  const {
    name,
    component_slug,
    code,
    demos,
    registry,
    license,
    unknown_dependencies,
  } = form.getValues()

  return Boolean(
    name?.length >= 2 &&
      component_slug?.length >= 2 &&
      code?.length > 0 &&
      demos?.length > 0 &&
      registry &&
      license &&
      unknown_dependencies?.length === 0,
  )
}
