import { useClerkSupabaseClient } from "@/utils/clerk"
import {
  extractComponentNames,
  extractDemoComponentName,
  extractDependencies,
  findInternalDependencies,
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
  const { removedImports, modifiedCode } = removeComponentImports(
    demoCode,
    componentNames,
  )

  if (removedImports.length > 0) {
    setImportsToRemove(removedImports)
    setDemoCodeError(
      "Component imports in the Demo component are automatic. Please confirm deletion.",
    )
  } else {
    setImportsToRemove([])
    setDemoCodeError(null)
  }

  return { modifiedCode, removedImports }
}

export const handleApproveDelete = async (
  demoCode: string,
  parsedComponentNames: string[],
  form: UseFormReturn<FormData>,
  setImportsToRemove: (imports: string[]) => void,
  setDemoCodeError: (error: string | null) => void,
): Promise<string | null> => {
  const { modifiedCode } = removeComponentImports(
    demoCode,
    parsedComponentNames,
  )
  return modifiedCode
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
  setParsedDependencies(code ? extractDependencies(code) : {})
  setParsedDemoDependencies(demoCode ? extractDependencies(demoCode) : {})
  setParsedDemoComponentName(demoCode ? extractDemoComponentName(demoCode) : "")

  const componentDeps = extractDependencies(code)
  const demoDeps = extractDependencies(demoCode)
  setInternalDependencies(findInternalDependencies(componentDeps, demoDeps))
}
