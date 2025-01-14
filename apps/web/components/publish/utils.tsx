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
  demo_name: z.string().min(2, {
    message: "Demo name must be at least 2 characters.",
  }),
  tailwind_config: z.string().optional(),
  globals_css: z.string().optional(),
  registry: z.string().default("ui"),
  publish_as_username: z.string().optional(),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
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
  is_public: z.boolean().default(true),
  preview_image_data_url: z.string({
    required_error: "Preview image is required.",
  }),
  preview_image_file: z.instanceof(File, {
    message: "Preview image file is required.",
  }),
  preview_video_data_url: z.string().optional(),
  preview_video_file: z.instanceof(File).optional(),
  license: z.string().default("mit"),
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

export const isFormValid = (form: UseFormReturn<FormData>): boolean => {
  const {
    name,
    component_slug,
    code,
    demo_code,
    demo_name,
    description,
    registry,
    license,
    tags,
    preview_image_data_url,
    slug_available,
    unknown_dependencies,
  } = form.getValues()

  return Boolean(
    name?.length >= 2 &&
      component_slug?.length >= 2 &&
      code?.length > 0 &&
      demo_code?.length > 0 &&
      demo_name?.length >= 2 &&
      description?.length >= 20 &&
      registry &&
      license &&
      tags?.length > 0 &&
      preview_image_data_url &&
      unknown_dependencies?.length === 0 &&
      slug_available === true,
  )
}
