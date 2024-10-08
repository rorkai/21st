import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react"
import { useAtom } from "jotai"
import { useUser } from "@clerk/nextjs"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { useComponentSlug } from "@/hooks/useComponentSlug"
import { useDebugMode } from "@/hooks/useDebugMode"
import { useValidTags } from "@/hooks/useValidateTags"
import {
  demoCodeErrorAtom,
  parsedDependenciesAtom,
  parsedComponentNamesAtom,
  parsedDemoDependenciesAtom,
  internalDependenciesAtom,
  importsToRemoveAtom,
  parsedDemoComponentNameAtom,
  FormData,
  formatComponentName,
} from "./ComponentFormUtils"
import { Tag } from "@/types/types"
import {
  extractComponentNames,
  extractDependencies,
  extractDemoComponentName,
  findInternalDependencies,
  removeComponentImports,
} from "../../utils/parsers"
import { UseFormReturn } from "react-hook-form"
import {
  isSlugManuallyEditedAtom,
  slugCheckingAtom,
  slugErrorAtom,
  slugAvailableAtom,
} from "./ComponentFormAtoms"

type ComponentFormState = {
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  step: number
  setStep: Dispatch<SetStateAction<number>>
  isSuccessDialogOpen: boolean
  setIsSuccessDialogOpen: Dispatch<SetStateAction<boolean>>
  newComponentSlug: string
  setNewComponentSlug: Dispatch<SetStateAction<string>>
  availableTags: Tag[]
  setAvailableTags: Dispatch<SetStateAction<Tag[]>>
  isConfirmDialogOpen: boolean
  setIsConfirmDialogOpen: Dispatch<SetStateAction<boolean>>
  isSlugManuallyEdited: boolean
  setIsSlugManuallyEdited: Dispatch<SetStateAction<boolean>>
  previewImage: string | null
  setPreviewImage: Dispatch<SetStateAction<string | null>>
  demoCodeError: string | null
  setDemoCodeError: Dispatch<SetStateAction<string | null>>
  parsedDependencies: Record<string, string>
  setParsedDependencies: Dispatch<SetStateAction<Record<string, string>>>
  parsedComponentNames: string[]
  setParsedComponentNames: Dispatch<SetStateAction<string[]>>
  parsedDemoDependencies: Record<string, string>
  setParsedDemoDependencies: Dispatch<SetStateAction<Record<string, string>>>
  internalDependencies: Record<string, string>
  setInternalDependencies: Dispatch<SetStateAction<Record<string, string>>>
  importsToRemove: string[]
  setImportsToRemove: Dispatch<SetStateAction<string[]>>
  parsedDemoComponentName: string
  setParsedDemoComponentName: Dispatch<SetStateAction<string>>
  user: ReturnType<typeof useUser>["user"]
  client: ReturnType<typeof useClerkSupabaseClient>
  isDebug: boolean
  slugAvailable: boolean | null
  slugChecking: boolean
  slugError: string | null
  generateUniqueSlug: (name: string) => Promise<string>
  checkSlug: (slug: string) => void
  validTags: Tag[] | undefined
  isValidatingTags: boolean
  name: string
  componentSlug: string
  code: string
  demoCode: string
  generateAndSetSlug: (name: string) => Promise<void>
  loadAvailableTags: () => Promise<void>
  checkDemoCode: (demoCode: string, componentNames: string[]) => void
}

export const useComponentFormState = (
  form: UseFormReturn<FormData>,
): ComponentFormState => {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [newComponentSlug, setNewComponentSlug] = useState("")
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useAtom(
    isSlugManuallyEditedAtom,
  )
  const [slugChecking, setSlugChecking] = useAtom(slugCheckingAtom)
  const [slugError, setSlugError] = useAtom(slugErrorAtom)
  const [slugAvailable, setSlugAvailable] = useAtom(slugAvailableAtom)
  const [demoCodeError, setDemoCodeError] = useAtom(demoCodeErrorAtom)
  const [internalDependencies, setInternalDependencies] = useAtom(
    internalDependenciesAtom,
  )

  const [parsedDependencies, setParsedDependencies] = useAtom(
    parsedDependenciesAtom,
  )
  const [parsedComponentNames, setParsedComponentNames] = useAtom(
    parsedComponentNamesAtom,
  )
  const [parsedDemoDependencies, setParsedDemoDependencies] = useAtom(
    parsedDemoDependenciesAtom,
  )
  const [importsToRemove, setImportsToRemove] = useAtom(importsToRemoveAtom)
  const [parsedDemoComponentName, setParsedDemoComponentName] = useAtom(
    parsedDemoComponentNameAtom,
  )

  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const isDebug = useDebugMode()
  const { generateUniqueSlug, checkSlug } = useComponentSlug()
  const { data: validTags, isLoading: isValidatingTags } = useValidTags(
    form.watch("tags"),
  )

  const name = form.watch("name")
  const componentSlug = form.watch("component_slug")
  const code = form.watch("code")
  const demoCode = form.watch("demo_code")

  useEffect(() => {
    if (user) {
      console.log("Current user:", user)
      console.log("User username:", user.username)
    }
  }, [user])

  useEffect(() => {
    const updateSlug = async () => {
      if (name && !componentSlug) {
        const newSlug = await generateUniqueSlug(name)
        form.setValue("component_slug", newSlug)
        setIsSlugManuallyEdited(false)
      }
    }

    updateSlug()
  }, [name, componentSlug, form, generateUniqueSlug])

  useEffect(() => {
    if (componentSlug && isSlugManuallyEdited) {
      const timer = setTimeout(() => {
        checkSlug(componentSlug)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [componentSlug, checkSlug, isSlugManuallyEdited])

  useEffect(() => {
    setParsedComponentNames(code ? extractComponentNames(code) : [])
    setParsedDependencies(code ? extractDependencies(code) : {})
    setParsedDemoDependencies(demoCode ? extractDependencies(demoCode) : {})
  }, [
    code,
    demoCode,
    setParsedComponentNames,
    setParsedDependencies,
    setParsedDemoDependencies,
  ])

  useEffect(() => {
    setParsedDemoComponentName(
      demoCode ? extractDemoComponentName(demoCode) : "",
    )
  }, [demoCode, setParsedDemoComponentName])

  const checkDemoCode = useCallback(
    (demoCode: string, componentNames: string[]) => {
      const { removedImports } = removeComponentImports(
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
    },
    [setImportsToRemove, setDemoCodeError],
  )

  useEffect(() => {
    const componentNames = extractComponentNames(code)
    if (componentNames.length > 0 && demoCode) {
      checkDemoCode(demoCode, componentNames)
    }
  }, [code, demoCode, checkDemoCode])

  useEffect(() => {
    const componentDeps = extractDependencies(code)
    const demoDeps = extractDependencies(demoCode)

    const internalDeps = findInternalDependencies(componentDeps, demoDeps)

    setInternalDependencies(internalDeps)
  }, [code, demoCode])

  useEffect(() => {
    if (step === 2 && parsedComponentNames.length > 0) {
      const formattedName = formatComponentName(parsedComponentNames[0] || "")
      form.setValue("name", formattedName)
      generateAndSetSlug(formattedName)
    }
  }, [step, parsedComponentNames, form])

  const generateAndSetSlug = useCallback(
    async (name: string) => {
      const newSlug = await generateUniqueSlug(name)
      form.setValue("component_slug", newSlug)
      setIsSlugManuallyEdited(false)
    },
    [generateUniqueSlug, form, setIsSlugManuallyEdited]
  )

  const loadAvailableTags = useCallback(async () => {
    const { data, error } = await client.from("tags").select("*").order("name")

    if (error) {
      console.error("Error loading tags:", error)
    } else {
      setAvailableTags(data || [])
    }
  }, [client, setAvailableTags])

  useEffect(() => {
    loadAvailableTags()
  }, [loadAvailableTags])

  return {
    isLoading,
    setIsLoading,
    step,
    setStep,
    isSuccessDialogOpen,
    setIsSuccessDialogOpen,
    newComponentSlug,
    setNewComponentSlug,
    availableTags,
    setAvailableTags,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    isSlugManuallyEdited,
    setIsSlugManuallyEdited,
    previewImage,
    setPreviewImage,
    demoCodeError,
    setDemoCodeError,
    parsedDependencies,
    setParsedDependencies,
    parsedComponentNames,
    setParsedComponentNames,
    parsedDemoDependencies,
    setParsedDemoDependencies,
    internalDependencies,
    setInternalDependencies,
    importsToRemove,
    setImportsToRemove,
    parsedDemoComponentName,
    setParsedDemoComponentName,
    user,
    client,
    isDebug,
    slugAvailable,
    slugChecking,
    slugError,
    generateUniqueSlug,
    checkSlug,
    validTags,
    isValidatingTags,
    name,
    componentSlug,
    code,
    demoCode,
    generateAndSetSlug,
    loadAvailableTags,
    checkDemoCode,
  }
}
