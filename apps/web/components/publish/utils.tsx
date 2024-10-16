import { z } from "zod"
import {
  extractComponentNames,
  extractDemoComponentNames,
  extractDependencies,
  extractExportedTypes,
} from "@/utils/parsers"
import { generateSandpackFiles } from "@/utils/sandpack"

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

export const prepareFilesForPublishPreview = (
  code: string,
  demoCode: string,
  publisherUsername: string,
  isDarkTheme: boolean,
) => {
  const componentNames = extractComponentNames(code)
  const types = extractExportedTypes(code)
  const demoComponentNames = extractDemoComponentNames(demoCode)

  const hasUseClient = /^"use client";?\s*/.test(demoCode)

  const importStatements = `
  import { ${componentNames.join(", ")} } from "./Component";\n
  ${types.length > 0 ? `import { ${types.join(", ")} } from "./Component";\n` : ""}
  `

  const updatedDemoCode = `
  ${hasUseClient ? `"use client";\n${importStatements}` : importStatements}
  ${demoCode.replace(/^"use client";?\s*/, "")}
  `

  const files = generateSandpackFiles({
    demoComponentName: demoComponentNames[0]!,
    componentSlug: "Component",
    relativeImportPath: `/components/ui/${publisherUsername}`,
    code,
    demoCode: updatedDemoCode,
    theme: isDarkTheme ? "dark" : "light",
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
