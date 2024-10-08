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
  const demoComponentName = extractDemoComponentName(demoCode)

  const updatedDemoCode = `import { ${componentNames.join(", ")} } from "./Component";\n${demoCode}`

  const files = {
    "/App.tsx": `
import React from 'react';
import { ${demoComponentName} } from './Demo';

export default function App() {
  return (
    <div className="flex justify-center items-center h-screen p-4 relative">
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        opacity: 0.5,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(#00000055 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }}>
        <style>{
          \`@media (prefers-color-scheme: dark) {
            div {
              background: radial-gradient(#ffffff22 1px, transparent 1px);
            }
          }\`
        }</style>
      </div>
      <div className="flex justify-center items-center max-w-[600px] w-full h-full max-h-[600px] p-4 relative">
      <${demoComponentName} />
      </div>
    </div>
  );
}
`,
    "/Component.tsx": code,
    "/Demo.tsx": updatedDemoCode,
    "/lib/utils.ts": `
export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
`,
    "/tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          esModuleInterop: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
      },
      null,
      2,
    ),
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
