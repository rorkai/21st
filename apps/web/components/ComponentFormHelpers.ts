import { useClerkSupabaseClient } from "@/utils/clerk"
import {
  extractComponentNames,
  extractDemoComponentName,
  parseDependencies,
  parseInternalDependencies,
  removeComponentImports,
} from "@/utils/parsers"
import { FormData } from "./ComponentFormUtils"
import { UseFormReturn } from "react-hook-form"

export const uploadToStorage = async (
  client: ReturnType<typeof useClerkSupabaseClient>,
  fileName: string,
  content: string,
) => {
  const { error } = await client.storage
    .from("components")
    .upload(fileName, content, {
      contentType: "text/plain",
      upsert: true,
    })

  if (error) throw error

  const { data: publicUrlData } = client.storage
    .from("components")
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}

export const uploadPreviewImage = async (
  client: ReturnType<typeof useClerkSupabaseClient>,
  file: File,
  componentSlug: string,
): Promise<string> => {
  const fileExtension = file.name.split(".").pop()
  const fileName = `${componentSlug}-preview-${Date.now()}.${fileExtension}`
  const { error } = await client.storage
    .from("components")
    .upload(fileName, file, { upsert: true })

  if (error) throw error

  const { data } = client.storage.from("components").getPublicUrl(fileName)

  return data.publicUrl
}

export const checkDemoCode = (
  demoCode: string,
  componentNames: string[],
  setImportsToRemove: (imports: string[]) => void,
  setDemoCodeError: (error: string | null) => void,
) => {
  const { removedImports } = removeComponentImports(demoCode, componentNames)

  if (removedImports.length > 0) {
    setImportsToRemove(removedImports)
    setDemoCodeError(
      "Component imports in the Demo component are automatic. Please confirm deletion.",
    )
  } else {
    setImportsToRemove([])
    setDemoCodeError(null)
  }
}

export const handleApproveDelete = (
  demoCode: string,
  parsedComponentNames: string[],
  form: UseFormReturn<FormData>,
  setImportsToRemove: (imports: string[]) => void,
  setDemoCodeError: (error: string | null) => void,
) => {
  const { modifiedCode } = removeComponentImports(
    demoCode,
    parsedComponentNames,
  )
  form.setValue("demo_code", modifiedCode)
  setImportsToRemove([])
  setDemoCodeError(null)
}

export const handleFileChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setPreviewImage: (image: string) => void,
  form: UseFormReturn<FormData>,
) => {
  const file = event.target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    form.setValue("preview_url", file)
  }
}

export const generateAndSetSlug = async (
  name: string,
  generateUniqueSlug: (name: string) => Promise<string>,
  form: UseFormReturn<FormData>,
) => {
  const newSlug = await generateUniqueSlug(name)
  form.setValue("component_slug", newSlug)
}

export const updateDependencies = (
  code: string,
  demoCode: string,
  setParsedComponentNames: (names: string[]) => void,
  setParsedDependencies: (deps: Record<string, string>) => void,
  setParsedDemoDependencies: (deps: Record<string, string>) => void,
  setParsedDemoComponentName: (name: string) => void,
  setInternalDependencies: (deps: Record<string, string>) => void,
) => {
  setParsedComponentNames(code ? extractComponentNames(code) : [])
  setParsedDependencies(code ? parseDependencies(code) : {})
  setParsedDemoDependencies(demoCode ? parseDependencies(demoCode) : {})
  setParsedDemoComponentName(demoCode ? extractDemoComponentName(demoCode) : "")

  const componentDeps = parseInternalDependencies(code)
  const demoDeps = parseInternalDependencies(demoCode)
  const combinedDeps = { ...componentDeps, ...demoDeps }
  setInternalDependencies(combinedDeps)
}
