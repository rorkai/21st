import { z } from "zod"
import {
  extractComponentNames,
  extractDemoComponentName,
  extractDependencies,
  extractExportedTypes,
} from "@/utils/parsers"
import { generateFiles } from "@/utils/generateFiles"

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
  license: z.string().optional(),
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

export const prepareFilesForPreview = (code: string, demoCode: string) => {
  const componentNames = extractComponentNames(code)
  const types = extractExportedTypes(code)
  const demoComponentName = extractDemoComponentName(demoCode)
  console.log("componentNames", componentNames)
  console.log("types", types)

  const updatedDemoCode = `
  import * as React from "react"
  import { ${componentNames.join(", ")} } from "./Component";\n
  ${types.length > 0 ? `import { ${types.join(", ")} } from "./Component";\n` : ""}
  ${demoCode}
  `

  console.log(updatedDemoCode)

  const files = generateFiles({
    demoComponentName,
    componentSlug: "Component",
    code,
    demoCode: updatedDemoCode,
  })

  const dependencies = {
    ...extractDependencies(code),
    ...extractDependencies(demoCode),
  }

  return { files, dependencies }
}

export const isFormValid = (
  form: any,
  internalDependencies: Record<string, string>,
  slugAvailable: boolean | undefined,
) => {
  const { name, component_slug, code, demo_code } = form.getValues()
  return (
    name.length >= 2 &&
    component_slug.length >= 2 &&
    code.length > 0 &&
    demo_code.length > 0 &&
    Object.values(internalDependencies).every((slug) => slug) &&
    slugAvailable === true
  )
}
