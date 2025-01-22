"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LoadingSpinner } from "../../ui/loading-spinner"
import { LoadingDialog } from "../../ui/loading-dialog"

import { useDebugMode } from "@/hooks/use-debug-mode"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { usePublishAs } from "./hooks/use-publish-as"
import { useCodeInputsAutoFocus } from "./hooks/use-code-inputs-auto-focus"

import { cn } from "@/lib/utils"
import { uploadToR2 } from "@/lib/r2"
import { addTagsToDemo } from "@/lib/queries"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { addVersionToUrl } from "@/lib/utils/url"
import {
  extractComponentNames,
  extractNPMDependencies,
  extractDemoComponentNames,
  extractRegistryDependenciesFromImports,
  extractAmbigiousRegistryDependencies,
} from "../../../lib/parsers"

import { Tag } from "@/types/global"
import { FormStep } from "@/types/global"
import { Tables } from "@/types/supabase"
import { formSchema, FormData, isFormValid } from "./config/utils"

import { ComponentDetailsForm } from "./components/forms/component-form"
import { DemoDetailsForm } from "./components/forms/demo-form"
import { PublishHeader } from "./components/publish-header"
import { DemoPreviewTabs } from "./components/preview-with-tabs"
import { NameSlugStep } from "./components/first-stap-layout"
import { EditorStep } from "./components/code-editor"
import { SuccessDialog } from "./components/success-dialog"
import { DeleteDemoDialog } from "./components/delete-demo-dialog"
import { EditCodeFileCard } from "./components/edit-code-file-card"
import {
  DebugInfoDisplay,
  DemoComponentGuidelinesAlert,
  CodeGuidelinesAlert,
  GlobalStylesGuidelinesAlert,
  TailwindGuidelinesAlert,
} from "./components/alerts"
import { generateDemoSlug } from "./hooks/use-is-check-slug-available"
import { useIsAdmin } from "./hooks/use-is-admin"
export interface ParsedCodeData {
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  directRegistryDependencyImports: string[]
  componentNames: string[]
  demoComponentNames: string[]
}

type CodeTab = "component" | "tailwind" | "globals"

interface PublishComponentFormProps {
  mode?: "full" | "add-demo"
  existingComponent?: any
  initialStep?: FormStep
  initialCode?: string
  initialTailwindConfig?: string | null
  initialGlobalCss?: string | null
}

const PreviewSection = React.memo(
  ({
    isPreviewReady,
    formStep,
    code,
    componentSlug,
    registryToPublish,
    directRegistryDependencies,
    demoDirectRegistryDependencies,
    isDarkTheme,
    customTailwindConfig,
    customGlobalCss,
    form,
    parsedCode,
    shouldBlurPreview,
    onRestartPreview,
    previewKey,
    currentDemoIndex,
  }: {
    isPreviewReady: boolean
    formStep: FormStep
    code: string
    componentSlug: string
    registryToPublish: string
    directRegistryDependencies: string[]
    demoDirectRegistryDependencies: string[]
    isDarkTheme: boolean
    customTailwindConfig?: string
    customGlobalCss?: string
    form: any
    parsedCode: ParsedCodeData
    shouldBlurPreview: boolean
    onRestartPreview: () => void
    previewKey: string
    currentDemoIndex: number
  }) => {
    if (!isPreviewReady) {
      return (
        <div className="p-8 w-1/2">
          <DemoComponentGuidelinesAlert
            mainComponentName={parsedCode.componentNames[0] ?? "MyComponent"}
            componentSlug={componentSlug}
            registryToPublish={registryToPublish}
          />
        </div>
      )
    }

    return (
      <div
        className={cn(
          "pointer-events-auto transition-[width] duration-300",
          formStep === "demoCode" ? "w-1/2" : "w-2/3",
          formStep === "demoCode" && "!w-1/2",
        )}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <React.Suspense fallback={<LoadingSpinner />}>
            <DemoPreviewTabs
              code={code}
              slugToPublish={componentSlug}
              registryToPublish={registryToPublish}
              directRegistryDependencies={directRegistryDependencies}
              demoDirectRegistryDependencies={demoDirectRegistryDependencies}
              isDarkTheme={isDarkTheme}
              customTailwindConfig={customTailwindConfig}
              customGlobalCss={customGlobalCss}
              form={form}
              shouldBlurPreview={shouldBlurPreview}
              onRestartPreview={onRestartPreview}
              formStep={formStep}
              previewKey={previewKey}
              currentDemoIndex={currentDemoIndex}
            />
          </React.Suspense>
        </motion.div>
      </div>
    )
  },
)

PreviewSection.displayName = "PreviewSection"

export default function PublishComponentForm({
  mode = "full",
  existingComponent,
  initialStep,
  initialCode,
  initialTailwindConfig,
  initialGlobalCss,
}: PublishComponentFormProps) {
  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isDebug = useDebugMode()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState("component-info")
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0)

  const [formStartTime] = useState(() => Date.now())
  const [publishAttemptCount, setPublishAttemptCount] = useState(0)

  const isAddDemoMode = mode === "add-demo"
  const isUserAdmin = useIsAdmin()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isAddDemoMode
      ? {
          name: existingComponent.name,
          code: initialCode || "",
          component_slug: existingComponent.component_slug,
          registry: existingComponent.registry,
          description: existingComponent.description,
          license: existingComponent.license,
          website_url: existingComponent.website_url,
          is_public: existingComponent.is_public,
          publish_as_username: user?.username ?? undefined,
          unknown_dependencies: [],
          direct_registry_dependencies:
            existingComponent.direct_registry_dependencies || [],
          tailwind_config: existingComponent.tailwind_config_extension || "",
          globals_css: existingComponent.global_css_extension || "",
          demos: [
            {
              name: "",
              demo_code: "",
              demo_slug: "",
              tags: [],
              preview_image_data_url: "",
              preview_image_file: new File([], "placeholder"),
              preview_video_data_url: "",
              preview_video_file: new File([], "placeholder"),
              demo_direct_registry_dependencies: [],
              demo_dependencies: {},
            },
          ],
        }
      : {
          name: "",
          component_slug: "",
          registry: "ui",
          publish_as_username: user?.username ?? undefined,
          unknown_dependencies: [],
          direct_registry_dependencies: [],
          code: "",
          demos: [
            {
              name: "",
              demo_code: "",
              preview_image_data_url: "",
              preview_image_file: undefined,
              preview_video_data_url: "",
              preview_video_file: undefined,
              demo_direct_registry_dependencies: [],
              tags: [],
              demo_dependencies: {},
            },
          ],
          description: "",
          license: "mit",
          website_url: "",
          is_public: isUserAdmin,
        },
  })

  const { component_slug: componentSlug, code, demos } = form.getValues()
  const currentDemo = demos?.[currentDemoIndex]
  const demoCode = currentDemo?.demo_code || ""
  const unknownDependencies = form.watch("unknown_dependencies") || []
  const directRegistryDependencies = form.watch("direct_registry_dependencies")
  const demoDirectRegistryDependencies = form.watch(
    `demos.${currentDemoIndex}.demo_direct_registry_dependencies`,
  )
  const registryToPublish = form.watch("registry")

  const isFirstRender = useRef(true)
  const [isNavigatingAway, setIsNavigatingAway] = useState(false)
  const stepFromUrl = searchParams.get("step") as FormStep | null
  const [formStep, setFormStep] = useState<FormStep>(
    initialStep || stepFromUrl || "nameSlugForm",
  )

  const updateStepInUrl = useCallback(
    (newStep: FormStep) => {
      if (isFirstRender.current && initialStep) {
        isFirstRender.current = false
        return
      }

      const params = new URLSearchParams(searchParams)
      if (newStep === "nameSlugForm") {
        params.delete("step")
      } else {
        params.set("step", newStep)
      }

      setIsNavigatingAway(true)

      if (newStep === "nameSlugForm") {
        router.replace(pathname)
      } else {
        router.push(`${pathname}?${params.toString()}`)
      }

      setIsNavigatingAway(false)
    },
    [pathname, router, searchParams, initialStep],
  )

  const [previousStep, setPreviousStep] = useState<FormStep>()

  const [isEditingFromCard, setIsEditingFromCard] = useState(false)

  const handleStepChange = async (newStep: FormStep) => {
    setPreviousStep(formStep)

    if (
      (isAddingNewDemo || isEditingFromCard) &&
      newStep === "detailedForm" &&
      formStep === "demoCode"
    ) {
      if (isAddingNewDemo) {
        const demos = form.getValues("demos") || []
        form.setValue("demos", demos.slice(0, -1))
      }
      setIsAddingNewDemo(false)
      setIsEditingFromCard(false)
    } else if (newStep === "detailedForm") {
      setIsAddingNewDemo(false)
      setIsEditingFromCard(false)
    }

    if (newStep === "demoCode") {
      const demos = form?.getValues("demos") || []
      const currentDemo = demos[currentDemoIndex]
      if (!currentDemo?.demo_code) {
        const demoSlug = await generateDemoSlug(
          client,
          currentDemo?.name || "demo",
          existingComponent?.id || null,
          user?.id as string,
        )

        form?.setValue(`demos.${currentDemoIndex}`, {
          name: "",
          demo_slug:
            mode === "full" && currentDemoIndex === 0 ? "default" : demoSlug,
          demo_code: "",
          tags: [],
          preview_image_data_url: "",
          preview_image_file: new File([], "placeholder"),
          preview_video_data_url: "",
          preview_video_file: new File([], "placeholder"),
          demo_direct_registry_dependencies: [],
          demo_dependencies: {},
          tailwind_config: customTailwindConfig,
          global_css: customGlobalCss,
        })

        form?.setValue("unknown_dependencies", [])
      }
    }

    setFormStep(newStep)
  }

  const [parsedCode, setParsedCode] = useState<ParsedCodeData>({
    dependencies: {},
    demoDependencies: {},
    directRegistryDependencyImports: [],
    componentNames: [],
    demoComponentNames: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customTailwindConfig, setCustomTailwindConfig] = useState<
    string | undefined
  >(undefined)
  const [customGlobalCss, setCustomGlobalCss] = useState<string | undefined>(
    undefined,
  )
  const publishAsUsername = form.watch("publish_as_username")
  if (publishAsUsername === undefined && user?.username) {
    form.setValue("publish_as_username", user.username)
  }
  const { isAdmin, user: publishAsUser } = usePublishAs({
    username: publishAsUsername ?? "",
  })

  if (process.env.NODE_ENV === "development") {
    console.log("form", form.getValues())
  }

  useEffect(() => {
    const message = "You have unsaved changes. Are you sure you want to leave?"

    if (formStep === "nameSlugForm") {
      window.onbeforeunload = null
      window.onpopstate = null
      return
    }

    window.onpopstate = () => {
      if (!isNavigatingAway && !window.confirm(message)) {
        window.history.pushState(null, "", window.location.href)
      } else {
        setIsNavigatingAway(true)
        router.back()
      }
    }

    // Add history entry only on the first non-nameSlugForm step
    if (isFirstRender.current) {
      window.history.pushState(null, "", window.location.href)
      isFirstRender.current = false
    }

    return () => {
      window.onpopstate = null
    }
  }, [formStep, router])

  useEffect(() => {
    const parseDependenciesFromCode = () => {
      try {
        const componentNames = extractComponentNames(code)
        const componentSlug = form.getValues("component_slug")
        const dependencies = extractNPMDependencies(code)
        const demoDependencies = extractNPMDependencies(demoCode)
        const demoComponentNames = extractDemoComponentNames(demoCode)
        const directRegistryDependencyImports =
          extractRegistryDependenciesFromImports(code)

        setParsedCode({
          dependencies,
          demoDependencies,
          componentNames,
          demoComponentNames,
          directRegistryDependencyImports: [
            ...new Set(directRegistryDependencyImports),
          ],
        })

        // Skip checking component dependencies in add-demo mode since they are already resolved
        const ambigiousRegistryDependencies = isAddDemoMode
          ? []
          : [
              ...new Set(
                Object.values(extractAmbigiousRegistryDependencies(code)),
              ),
            ]

        const ambigiousDemoDirectRegistryDependencies = [
          ...new Set(
            Object.values(extractAmbigiousRegistryDependencies(demoCode)),
          ),
        ]

        const parsedUnknownDependencies = [
          ...ambigiousRegistryDependencies.map((d) => ({
            ...d,
            isDemoDependency: false,
          })),
          ...ambigiousDemoDirectRegistryDependencies.map((d) => ({
            ...d,
            isDemoDependency: true,
          })),
        ]
          .map((d) => ({
            slugWithUsername: d.slug,
            registry: d.registry,
            isDemoDependency: d.isDemoDependency,
          }))
          .filter((d) => componentSlug !== d.slugWithUsername)
          .filter(
            (d) =>
              !(
                d.isDemoDependency
                  ? demoDirectRegistryDependencies
                  : directRegistryDependencies
              ).includes(d.slugWithUsername),
          )

        form.setValue(
          "unknown_dependencies",
          parsedUnknownDependencies.map((d) => d.slugWithUsername),
        )
        form.setValue(
          "unknown_dependencies_with_metadata",
          parsedUnknownDependencies,
        )
      } catch (error) {
        console.error("Error parsing dependencies from code:", error)
      }
    }

    parseDependenciesFromCode()
  }, [code, demoCode])

  const [publishProgress, setPublishProgress] = useState<string>("")
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false)

  const [createdDemoSlug, setCreatedDemoSlug] = useState<string>()

  const onSubmit = async (data: FormData) => {
    setPublishAttemptCount((count) => count + 1)
    setIsSubmitting(true)
    setIsLoadingDialogOpen(true)

    try {
      if (!publishAsUser?.id) {
        throw new Error("The user is not authorized. Please log in")
      }

      if (isAddDemoMode) {
        const baseFolder = `${existingComponent.user_id}/${existingComponent.component_slug}`

        for (const demo of data.demos) {
          const demoIndex = data.demos.indexOf(demo)
          setPublishProgress(
            `Publishing demo ${demoIndex + 1} of ${data.demos.length}...`,
          )

          const demoData: Omit<Tables<"demos">, "id"> = {
            component_id: existingComponent.id,
            demo_code: "",
            demo_dependencies: parsedCode.demoDependencies || {},
            preview_url: "",
            video_url: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            compiled_css: null,
            pro_preview_image_url: null,
            name: demo.name || "",
            demo_direct_registry_dependencies:
              demo.demo_direct_registry_dependencies || null,
            user_id: user?.id || "",
            fts: null,
            demo_slug: demo.demo_slug,
          }

          const [demoCodeUrl, previewImageR2Url, videoR2Url] =
            await Promise.all([
              uploadToR2({
                file: {
                  name: "demo.tsx",
                  type: "text/plain",
                  textContent: demo.demo_code,
                },
                fileKey: `${baseFolder}/${demo.demo_slug}/code.demo.tsx`,
                bucketName: "components-code",
              }),
              demo?.preview_image_file &&
              demo?.preview_image_file.size > 0 &&
              demo?.preview_image_data_url
                ? uploadToR2({
                    file: {
                      name: "preview.png",
                      type: demo.preview_image_file.type,
                      encodedContent: demo.preview_image_data_url.replace(
                        /^data:image\/(png|jpeg|jpg);base64,/,
                        "",
                      ),
                    },
                    fileKey: `${baseFolder}/${demo.demo_slug}/preview.png`,
                    bucketName: "components-code",
                    contentType: demo.preview_image_file.type,
                  })
                : Promise.resolve(null),
              demo?.preview_video_file &&
              demo?.preview_video_file.size > 0 &&
              demo?.preview_video_data_url
                ? uploadToR2({
                    file: {
                      name: "video.mp4",
                      type: "video/mp4",
                      encodedContent: demo.preview_video_data_url.replace(
                        /^data:video\/mp4;base64,/,
                        "",
                      ),
                    },
                    fileKey: `${baseFolder}/${demo.demo_slug}/video.mp4`,
                    bucketName: "components-code",
                    contentType: "video/mp4",
                  })
                : Promise.resolve(null),
            ])

          if (demoCodeUrl) {
            demoData.demo_code = addVersionToUrl(demoCodeUrl)
            demoData.preview_url = addVersionToUrl(previewImageR2Url) ?? null
            demoData.video_url = addVersionToUrl(videoR2Url) ?? null

            const { data: insertedDemo, error: insertError } = await client
              .from("demos")
              .insert(demoData)
              .select()
              .single()

            if (insertError) throw insertError

            if (demo.tags?.length) {
              await addTagsToDemo(
                client,
                insertedDemo.id,
                demo.tags.filter((tag) => !!tag.slug) as Tag[],
              )
            }

            setCreatedDemoSlug(demo.demo_slug)
          }
        }
      } else {
        setPublishProgress("Uploading component files...")
        const baseFolder = `${publishAsUser.id}/${data.component_slug}`

        if (!data.code) throw new Error("Component code is required")
        if (!data.demos.length) throw new Error("At least one demo is required")
        if (data.demos.some((demo) => !demo.demo_code))
          throw new Error("Demo code is required for all demos")

        const [codeUrl, tailwindConfigUrl, globalCssUrl] = await Promise.all([
          uploadToR2({
            file: {
              name: "code.tsx",
              type: "text/plain",
              textContent: data.code,
            },
            fileKey: `${baseFolder}/code.tsx`,
            bucketName: "components-code",
          }),
          customTailwindConfig
            ? uploadToR2({
                file: {
                  name: "tailwind.config.js",
                  type: "text/plain",
                  textContent: customTailwindConfig,
                },
                fileKey: `${baseFolder}/tailwind.config.js`,
                bucketName: "components-code",
              })
            : Promise.resolve(null),
          customGlobalCss
            ? uploadToR2({
                file: {
                  name: "globals.css",
                  type: "text/plain",
                  textContent: customGlobalCss,
                },
                fileKey: `${baseFolder}/globals.css`,
                bucketName: "components-code",
              })
            : Promise.resolve(null),
        ])

        setPublishProgress("Creating component...")
        const componentData = {
          name: data.name,
          component_names: parsedCode.componentNames,
          component_slug: data.component_slug,
          code: addVersionToUrl(codeUrl) || "",
          tailwind_config_extension: addVersionToUrl(tailwindConfigUrl),
          global_css_extension: addVersionToUrl(globalCssUrl),
          description: data.description ?? null,
          user_id: publishAsUser.id,
          dependencies: parsedCode.dependencies,
          demo_dependencies: parsedCode.demoDependencies,
          direct_registry_dependencies: data.direct_registry_dependencies,
          preview_url: "",
          video_url: "",
          registry: data.registry,
          license: data.license,
          website_url: data.website_url,
          is_public: data.is_public,
        } as Tables<"components">

        const { data: insertedComponent, error } = await client
          .from("components")
          .insert(componentData)
          .select()
          .single()

        if (error) {
          console.error("Error inserting component:", error)
          throw error
        }

        if (!data.is_public) {
          // create entry in submissions table
          const { error: submissionError } = await client
            .from("submissions")
            .insert({
              component_id: insertedComponent.id,
              status: "on_review",
            })

          if (submissionError) {
            console.error("Error inserting submission:", submissionError)
            throw submissionError
          }
        }

        for (const demo of data.demos) {
          const demoIndex = data.demos.indexOf(demo)
          setPublishProgress(
            `Publishing demo ${demoIndex + 1} of ${data.demos.length}...`,
          )

          const demoSlug = await generateDemoSlug(
            client,
            demo.name || "Default",
            insertedComponent.id,
            publishAsUser.id,
          )

          const demoData: Omit<Tables<"demos">, "id"> = {
            component_id: insertedComponent.id,
            demo_code: "",
            demo_dependencies: parsedCode.demoDependencies || {},
            preview_url: "",
            video_url: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            compiled_css: null,
            pro_preview_image_url: null,
            name: demo.name,
            demo_direct_registry_dependencies:
              demo.demo_direct_registry_dependencies || null,
            user_id: publishAsUser.id,
            fts: null,
            demo_slug: demoSlug,
          }

          const { data: insertedDemo, error: demoError } = await client
            .from("demos")
            .insert(demoData)
            .select()
            .single()

          if (demoError) throw demoError

          const demoFolder = `${baseFolder}/${insertedDemo.demo_slug}`

          const [demoCodeUrl, previewImageR2Url, videoR2Url] =
            await Promise.all([
              uploadToR2({
                file: {
                  name: "code.demo.tsx",
                  type: "text/plain",
                  textContent: demo.demo_code,
                },
                fileKey: `${demoFolder}/code.demo.tsx`,
                bucketName: "components-code",
              }),
              demo.preview_image_file &&
              demo.preview_image_file.size > 0 &&
              demo.preview_image_data_url
                ? uploadToR2({
                    file: {
                      name: "preview.png",
                      type: demo.preview_image_file.type,
                      encodedContent: demo.preview_image_data_url.replace(
                        /^data:image\/(png|jpeg|jpg);base64,/,
                        "",
                      ),
                    },
                    fileKey: `${demoFolder}/preview.png`,
                    bucketName: "components-code",
                    contentType: demo.preview_image_file.type,
                  })
                : Promise.resolve(null),
              demo.preview_video_file &&
              demo.preview_video_file.size > 0 &&
              demo.preview_video_data_url
                ? uploadToR2({
                    file: {
                      name: "video.mp4",
                      type: "video/mp4",
                      encodedContent: demo.preview_video_data_url.replace(
                        /^data:video\/mp4;base64,/,
                        "",
                      ),
                    },
                    fileKey: `${demoFolder}/video.mp4`,
                    bucketName: "components-code",
                    contentType: "video/mp4",
                  })
                : Promise.resolve(null),
            ])

          const { error: updateDemoError } = await client
            .from("demos")
            .update({
              demo_code: addVersionToUrl(demoCodeUrl),
              preview_url: addVersionToUrl(previewImageR2Url),
              video_url: addVersionToUrl(videoR2Url),
              updated_at: new Date().toISOString(),
            })
            .eq("id", insertedDemo.id)

          if (updateDemoError) throw updateDemoError

          if (demo.tags?.length) {
            await addTagsToDemo(
              client,
              insertedDemo.id,
              demo.tags.filter((tag) => !!tag.slug) as Tag[],
            )
          }
        }
      }

      setPublishProgress("Done!")
      setIsSuccessDialogOpen(true)
      trackEvent(AMPLITUDE_EVENTS.PUBLISH_COMPONENT, {
        componentName: data.name,
        componentSlug: data.component_slug,
        userId: user?.id,
        hasDemo: true,
        demosCount: data.demos.length,
        timeSpentEditing: Date.now() - formStartTime,
        publishAttempts: publishAttemptCount,
      })
    } catch (error) {
      console.error("Error adding component:", error)
      toast.error(
        `An error occurred while adding the component${error instanceof Error ? `: ${error.message}` : ""}`,
      )
    } finally {
      setIsSubmitting(false)
      setPublishProgress("")
      setIsLoadingDialogOpen(false)
    }
  }

  const handleGoToComponent = useCallback(() => {
    if (isAddDemoMode && existingComponent) {
      router.push(
        `/${existingComponent.user.username}/${existingComponent.component_slug}/${createdDemoSlug}`,
      )
    } else {
      router.push(`/${user?.username}/${form.getValues().component_slug}`)
    }
  }, [
    isAddDemoMode,
    existingComponent,
    createdDemoSlug,
    user?.username,
    form,
    router,
  ])

  const handleAddAnother = () => {
    form.reset()
    setIsSuccessDialogOpen(false)
    setFormStep("nameSlugForm")
    router.replace(pathname)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    onSubmit(formData)
  }

  const isPreviewReady = useMemo(() => {
    return (
      unknownDependencies?.length === 0 &&
      typeof code === "string" &&
      code.length > 0 &&
      typeof demoCode === "string" &&
      demoCode.length > 0
    )
  }, [unknownDependencies, code, demoCode])

  const { codeInputRef } = useCodeInputsAutoFocus(formStep === "detailedForm")

  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>("component")

  const handleCodeTabChange = useCallback((value: string) => {
    setActiveCodeTab(value as CodeTab)
  }, [])

  const isComponentInfoComplete = useCallback(() => {
    const { description, license, name, component_slug, registry } =
      form.getValues()
    return (
      !!description && !!license && !!name && !!component_slug && !!registry
    )
  }, [form])
  const handleAddNewDemo = () => {
    const demos = form.getValues().demos || []
    const newDemoIndex = demos.length

    form.setValue("demos", [
      ...demos,
      {
        name: "",
        demo_slug: "",
        demo_code: "",
        tags: [],
        preview_image_data_url: "",
        preview_image_file: new File([], "placeholder"),
        preview_video_data_url: "",
        preview_video_file: new File([], "placeholder"),
        demo_direct_registry_dependencies: [],
        demo_dependencies: currentDemo?.demo_dependencies || {},
      },
    ])

    setCurrentDemoIndex(newDemoIndex)
    setIsAddingNewDemo(true)
    handleStepChange("demoCode")
    setOpenAccordion(`demo-${newDemoIndex}`)
  }

  const isDemoComplete = (demoIndex: number) => {
    const demo = form.getValues().demos[demoIndex]
    return !!(
      demo?.name &&
      demo?.demo_code &&
      demo?.tags?.length > 0 &&
      demo?.preview_image_data_url
    )
  }

  const [demoToDelete, setDemoToDelete] = useState<{
    index: number
    name: string
  } | null>(null)

  const handleDeleteDemo = (index: number) => {
    const demos = form.getValues().demos
    // Don't allow deleting if it's the last demo
    if (demos.length <= 1) {
      return
    }

    const newDemos = demos.filter((_, i) => i !== index)

    if (index === 0 && newDemos.length > 0) {
      const firstDemo = newDemos[0]!
      newDemos[0] = {
        name: firstDemo.name || "Default",
        demo_slug: firstDemo.demo_slug,
        demo_code: firstDemo.demo_code,
        preview_image_data_url: firstDemo.preview_image_data_url,
        preview_image_file: firstDemo.preview_image_file,
        tags: firstDemo.tags,
        demo_direct_registry_dependencies:
          firstDemo.demo_direct_registry_dependencies,
        preview_video_data_url: firstDemo.preview_video_data_url,
        preview_video_file: firstDemo.preview_video_file,
        demo_dependencies: firstDemo.demo_dependencies || {},
      }
    }

    if (
      openAccordion === `demo-${index}` ||
      (index === 0 && openAccordion === "demo-info")
    ) {
      const newIndex = Math.max(0, index - 1)
      setCurrentDemoIndex(newIndex)
      setOpenAccordion(newIndex === 0 ? "demo-info" : `demo-${newIndex}`)
    } else if (openAccordion.startsWith("demo-")) {
      const openIndex = parseInt(openAccordion.replace("demo-", ""))
      if (openIndex > index) {
        setOpenAccordion(`demo-${openIndex - 1}`)
        if (currentDemoIndex === openIndex) {
          setCurrentDemoIndex(openIndex - 1)
        }
      }
    }

    setTimeout(() => {
      form.setValue("demos", newDemos)
      setDemoToDelete(null)
    }, 0)
  }

  const handleAccordionChange = useCallback(
    (value: string | undefined) => {
      setOpenAccordion(value || "")
    },
    [setOpenAccordion],
  )

  useEffect(() => {
    if (isComponentInfoComplete()) {
      setOpenAccordion("demo-info")
    }
  }, [isComponentInfoComplete])

  useEffect(() => {
    if (isAddDemoMode && initialCode) {
      form.setValue("code", initialCode)
      if (initialTailwindConfig) {
        form.setValue("tailwind_config", initialTailwindConfig)
      }
      if (initialGlobalCss) {
        form.setValue("globals_css", initialGlobalCss)
      }
    }
  }, [isAddDemoMode, initialCode, initialTailwindConfig, initialGlobalCss])

  const [previewKey, setPreviewKey] = useState<string>(
    () =>
      `${code}-${demoCode}-${customTailwindConfig}-${customGlobalCss}-${isDarkTheme}`,
  )
  const [shouldBlurPreview, setShouldBlurPreview] = useState(false)

  const [isFirstPreviewRender, setIsFirstPreviewRender] = useState(true)

  useEffect(() => {
    if (formStep === "demoCode" && isPreviewReady) {
      if (isFirstPreviewRender) {
        setIsFirstPreviewRender(false)
        return
      }

      const demoValue = form.getValues(`demos.${currentDemoIndex}.demo_code`)
      if (demoValue !== demoCode) {
        setShouldBlurPreview(true)
      }
    }
  }, [
    form,
    demoCode,
    formStep,
    isPreviewReady,
    currentDemoIndex,
    isFirstPreviewRender,
  ])

  const handleRestartPreview = () => {
    setPreviewKey(
      `${code}-${demoCode}-${customTailwindConfig}-${customGlobalCss}-${isDarkTheme}-${Date.now()}`,
    )
    setShouldBlurPreview(false)
  }

  const handleDemoCodeChange = (value: string) => {
    const demos = form.getValues("demos")
    if (!demos[currentDemoIndex]) return

    const updatedDemo = {
      ...demos[currentDemoIndex],
      name: demos[currentDemoIndex].name || "",
      demo_code: value || "",
      preview_image_data_url:
        demos[currentDemoIndex].preview_image_data_url || "",
      preview_image_file:
        demos[currentDemoIndex].preview_image_file ||
        new File([], "placeholder"),
      tags: demos[currentDemoIndex].tags || [],
    }

    demos[currentDemoIndex] = updatedDemo
    form.setValue("demos", demos)
    if (!isFirstPreviewRender) {
      setShouldBlurPreview(true)
    }
  }

  useEffect(() => {
    const demos = form.getValues().demos || []
    if (demos.length > 0) {
      const lastDemoIndex = demos.length - 1
      if (formStep === "detailedForm") {
        setOpenAccordion(`demo-${lastDemoIndex}`)
      }
    }
  }, [form.getValues().demos?.length, formStep])

  const [isAddingNewDemo, setIsAddingNewDemo] = useState(false)

  const handleEditClick = (index: number) => {
    setCurrentDemoIndex(index)
    setIsEditingFromCard(true)
    handleStepChange("demoCode")
  }

  return (
    <>
      <Form {...form}>
        {formStep === "nameSlugForm" && (
          <div className="flex flex-col scrollbar-hide items-start gap-2 py-8 max-h-[calc(100vh-40px)] px-[2px] overflow-y-auto w-1/3 min-w-[450px]">
            <NameSlugStep
              form={form}
              isAdmin={isAdmin}
              publishAsUsername={publishAsUsername}
              publishAsUser={publishAsUser}
              onContinue={() => handleStepChange("code")}
              onPublishAsChange={(username) =>
                form.setValue("publish_as_username", username)
              }
            />
          </div>
        )}

        {formStep !== "nameSlugForm" && (
          <div className="flex flex-col h-screen w-full">
            {formStep === "code" && (
              <>
                <PublishHeader
                  formStep={formStep}
                  componentSlug={componentSlug}
                  activeCodeTab={activeCodeTab}
                  setActiveCodeTab={handleCodeTabChange}
                  setFormStep={handleStepChange}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  isFormValid={isFormValid(form)}
                  form={form}
                  currentDemoIndex={currentDemoIndex}
                  setCurrentDemoIndex={setCurrentDemoIndex}
                />
                <div className="flex h-[calc(100vh-3rem)]">
                  <div className="w-1/2 border-r pointer-events-auto">
                    {activeCodeTab === "component" && (
                      <div className="h-full">
                        <EditorStep
                          form={form}
                          isDarkTheme={isDarkTheme}
                          fieldName="code"
                          value={code}
                          onChange={(value) => form.setValue("code", value)}
                        />
                      </div>
                    )}
                    {activeCodeTab === "tailwind" && (
                      <div className="h-full">
                        <EditorStep
                          form={form}
                          isDarkTheme={isDarkTheme}
                          fieldName="tailwind_config"
                          value={customTailwindConfig || ""}
                          onChange={(value) => setCustomTailwindConfig(value)}
                        />
                      </div>
                    )}
                    {activeCodeTab === "globals" && (
                      <div className="h-full">
                        <EditorStep
                          form={form}
                          isDarkTheme={isDarkTheme}
                          fieldName="globals_css"
                          value={customGlobalCss || ""}
                          onChange={(value) => setCustomGlobalCss(value)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 pointer-events-auto">
                    <div className="h-full p-8">
                      {activeCodeTab === "component" && <CodeGuidelinesAlert />}
                      {activeCodeTab === "tailwind" && (
                        <TailwindGuidelinesAlert />
                      )}
                      {activeCodeTab === "globals" && (
                        <GlobalStylesGuidelinesAlert />
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {(formStep === "demoCode" ||
              formStep === "demoDetails" ||
              formStep === "detailedForm") && (
              <>
                <PublishHeader
                  formStep={formStep}
                  componentSlug={componentSlug}
                  setFormStep={handleStepChange}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  isFormValid={isFormValid(form)}
                  form={form}
                  currentDemoIndex={currentDemoIndex}
                  setCurrentDemoIndex={setCurrentDemoIndex}
                  onAddDemo={handleAddNewDemo}
                  previousStep={previousStep}
                  isAddingNewDemo={isAddingNewDemo}
                  mode={mode}
                  isEditingFromCard={isEditingFromCard}
                />
                <div className="flex h-[calc(100vh-3.5rem)]">
                  <div
                    className={cn(
                      "border-r pointer-events-auto transition-[width] duration-300 max-h-screen overflow-y-auto",
                      formStep === "demoCode" ? "w-1/2" : "w-1/3",
                      formStep === "demoCode" && "!w-1/2",
                    )}
                  >
                    {formStep === "demoCode" && (
                      <EditorStep
                        form={form}
                        isDarkTheme={isDarkTheme}
                        fieldName={`demos.${currentDemoIndex}.demo_code`}
                        value={demoCode}
                        onChange={handleDemoCodeChange}
                      />
                    )}
                    {formStep === "demoDetails" && (
                      <div className="p-8">
                        <DemoDetailsForm
                          form={form}
                          demoIndex={currentDemoIndex}
                          mode={mode}
                        />
                      </div>
                    )}
                    {formStep === "detailedForm" && (
                      <div className="w-full flex flex-col gap-4 overflow-y-auto p-4">
                        <div className="space-y-4 p-[2px]">
                          <Accordion
                            type="single"
                            value={openAccordion}
                            onValueChange={handleAccordionChange}
                            collapsible
                            className="w-full"
                          >
                            {!isAddDemoMode && (
                              <AccordionItem value="component-info">
                                <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-all duration-200 ease-in-out -mx-2 px-2">
                                  <div className="flex items-center gap-2">
                                    Component info
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "gap-1.5 text-xs font-medium",
                                        isComponentInfoComplete()
                                          ? "border-emerald-500/20"
                                          : "border-amber-500/20",
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "size-1.5 rounded-full",
                                          isComponentInfoComplete()
                                            ? "bg-emerald-500"
                                            : "bg-amber-500",
                                        )}
                                        aria-hidden="true"
                                      />
                                      {isComponentInfoComplete()
                                        ? "Complete"
                                        : "Required"}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                  <div className="text-foreground">
                                    <ComponentDetailsForm
                                      form={form}
                                      handleSubmit={handleSubmit}
                                      isSubmitting={isSubmitting}
                                      hotkeysEnabled={!isSuccessDialogOpen}
                                    />

                                    <div className="space-y-3 mt-6">
                                      <EditCodeFileCard
                                        iconSrc={
                                          isDarkTheme
                                            ? "/tsx-file-dark.svg"
                                            : "/tsx-file.svg"
                                        }
                                        mainText={`${form.getValues("name")} code`}
                                        subText={`${parsedCode.componentNames.slice(0, 2).join(", ")}${parsedCode.componentNames.length > 2 ? ` +${parsedCode.componentNames.length - 2}` : ""}`}
                                        onEditClick={() => {
                                          handleStepChange("code")
                                          setIsEditingFromCard(true)
                                          codeInputRef.current?.focus()
                                        }}
                                      />
                                      <EditCodeFileCard
                                        iconSrc={
                                          isDarkTheme
                                            ? "/css-file-dark.svg"
                                            : "/css-file.svg"
                                        }
                                        mainText="Custom styles"
                                        subText="Tailwind config and globals.css"
                                        onEditClick={() => {
                                          handleStepChange("code")
                                          setIsEditingFromCard(true)
                                          setActiveCodeTab("tailwind")
                                        }}
                                      />
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}

                            {demos?.map((demo, index) => (
                              <AccordionItem
                                key={index}
                                value={`demo-${index}`}
                                className="bg-background border-none group"
                              >
                                <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-all duration-200 ease-in-out -mx-2 px-2">
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                      <div className="truncate flex-shrink min-w-0">
                                        {demo.name || `Demo ${index + 1}`}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "gap-1.5 text-xs font-medium shrink-0",
                                          isDemoComplete(index)
                                            ? "border-emerald-500/20"
                                            : "border-amber-500/20",
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "size-1.5 rounded-full",
                                            isDemoComplete(index)
                                              ? "bg-emerald-500"
                                              : "bg-amber-500",
                                          )}
                                          aria-hidden="true"
                                        />
                                        {isDemoComplete(index)
                                          ? "Complete"
                                          : "Required"}
                                      </Badge>
                                    </div>
                                    {demos.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 ml-auto mr-1 shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setDemoToDelete({
                                            index,
                                            name:
                                              demo?.name || `Demo ${index + 1}`,
                                          })
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                      </Button>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="text-foreground space-y-4">
                                    <DemoDetailsForm
                                      form={form}
                                      demoIndex={index}
                                      mode={mode}
                                    />
                                    <EditCodeFileCard
                                      iconSrc={
                                        isDarkTheme
                                          ? "/demo-file-dark.svg"
                                          : "/demo-file.svg"
                                      }
                                      mainText={`Demo ${index + 1} code`}
                                      onEditClick={() => {
                                        handleStepChange("demoCode")
                                        setIsEditingFromCard(true)
                                        setCurrentDemoIndex(index)
                                      }}
                                    />
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </div>
                    )}
                  </div>

                  <PreviewSection
                    isPreviewReady={isPreviewReady}
                    formStep={formStep}
                    code={code}
                    componentSlug={componentSlug}
                    registryToPublish={registryToPublish}
                    directRegistryDependencies={directRegistryDependencies}
                    demoDirectRegistryDependencies={
                      demoDirectRegistryDependencies
                    }
                    isDarkTheme={isDarkTheme}
                    customTailwindConfig={customTailwindConfig}
                    customGlobalCss={customGlobalCss}
                    form={form}
                    parsedCode={parsedCode}
                    shouldBlurPreview={shouldBlurPreview}
                    onRestartPreview={handleRestartPreview}
                    previewKey={previewKey}
                    currentDemoIndex={currentDemoIndex}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Form>
      {isDebug && (
        <DebugInfoDisplay
          componentNames={parsedCode.componentNames}
          demoComponentNames={parsedCode.demoComponentNames}
          dependencies={parsedCode.dependencies}
          demoDependencies={parsedCode.demoDependencies}
          directRegistryDependencyImports={
            parsedCode.directRegistryDependencyImports
          }
          unknownDependencies={unknownDependencies.map((dep) => ({
            slugWithUsername: dep,
            registry: "ui",
            isDemoDependency: false,
          }))}
        />
      )}
      <SuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onAddAnother={handleAddAnother}
        onGoToComponent={handleGoToComponent}
        mode={isAddDemoMode ? "demo" : "component"}
      />
      <LoadingDialog isOpen={isLoadingDialogOpen} message={publishProgress} />
      <DeleteDemoDialog
        isOpen={!!demoToDelete}
        onOpenChange={(open) => !open && setDemoToDelete(null)}
        onConfirm={() => demoToDelete && handleDeleteDemo(demoToDelete.index)}
        demoName={demoToDelete?.name || ""}
      />
    </>
  )
}
