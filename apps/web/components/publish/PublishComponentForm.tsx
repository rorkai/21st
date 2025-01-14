"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { uploadToR2 } from "@/lib/r2"
import { formSchema, FormData, isFormValid, DemoFormData } from "./utils"
import {
  extractComponentNames,
  extractNPMDependencies,
  extractDemoComponentNames,
  extractRegistryDependenciesFromImports,
  extractAmbigiousRegistryDependencies,
} from "../../lib/parsers"
import { Form } from "@/components/ui/form"
import { addTagsToComponent } from "@/lib/queries"
import { ComponentDetailsForm } from "./ComponentDetailsForm"
import { motion } from "framer-motion"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useDebugMode } from "@/hooks/use-debug-mode"
import { Tag } from "@/types/global"
import { PublishComponentPreview } from "./preview"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  DebugInfoDisplay,
  DemoComponentGuidelinesAlert,
  CodeGuidelinesAlert,
  GlobalStylesGuidelinesAlert,
  TailwindGuidelinesAlert,
} from "./alerts"
import { Tables } from "@/types/supabase"
import { LoadingSpinner } from "../LoadingSpinner"
import { toast } from "sonner"
import { usePublishAs } from "./hooks/use-publish-as"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { NameSlugStep } from "./steps/name-slug-step"
import { EditorStep } from "./steps/editor-step"
import { SuccessDialog } from "./success-dialog"
import { EditCodeFileCard } from "./edit-code-file-card"
import { useCodeInputsAutoFocus } from "./hooks/use-code-inputs-auto-focus"
import { DemoDetailsForm } from "./DemoDetailsForm"
import { PublishHeader } from "./PublishHeader"
import { FormStep } from "@/types/global"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAtom } from "jotai"
import { currentDemoIndexAtom, openAccordionAtom } from "@/atoms/publish"
import { LoadingDialog } from "../LoadingDialog"

export interface ParsedCodeData {
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  directRegistryDependencyImports: string[]
  componentNames: string[]
  demoComponentNames: string[]
}

type CodeTab = "component" | "tailwind" | "globals"

export default function PublishComponentForm() {
  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isDebug = useDebugMode()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [currentDemoIndex, setCurrentDemoIndex] = useAtom(currentDemoIndexAtom)
  const [openAccordion, setOpenAccordion] = useAtom(openAccordionAtom)

  const [formStartTime] = useState(() => Date.now())
  const [publishAttemptCount, setPublishAttemptCount] = useState(0)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
        },
      ],
      description: "",
      license: "mit",
      website_url: "",
      is_public: true,
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
    stepFromUrl || "nameSlugForm",
  )

  const updateStepInUrl = useCallback(
    (newStep: FormStep) => {
      const params = new URLSearchParams(searchParams)
      if (newStep === "nameSlugForm") {
        params.delete("step")
      } else {
        params.set("step", newStep)
      }

      if (isFirstRender.current) {
        window.history.pushState(null, "", window.location.href)
        isFirstRender.current = false
      }

      setIsNavigatingAway(true)

      if (newStep === "nameSlugForm") {
        router.replace(pathname)
      } else {
        router.push(`${pathname}?${params.toString()}`)
      }

      setIsNavigatingAway(false)
    },
    [pathname, router, searchParams],
  )

  const handleStepChange = useCallback(
    (newStep: FormStep) => {
      if (isNavigatingAway) return
      setFormStep(newStep)
      updateStepInUrl(newStep)
    },
    [updateStepInUrl, isNavigatingAway],
  )

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

        const ambigiousRegistryDependencies = [
          ...new Set(Object.values(extractAmbigiousRegistryDependencies(code))),
        ]
        const ambigiousDemoDirectRegistryDependencies = [
          ...new Set(
            Object.values(extractAmbigiousRegistryDependencies(demoCode)),
          ),
        ]

        const parsedUnknownDependencies = [
          ...ambigiousRegistryDependencies,
          ...ambigiousDemoDirectRegistryDependencies,
        ]
          .map((d) => ({
            slugWithUsername: d.slug,
            registry: d.registry,
            isDemoDependency: ambigiousRegistryDependencies?.includes(d)
              ? false
              : true,
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
      } catch (error) {
        console.error("Error parsing dependencies from code:", error)
      }
    }

    parseDependenciesFromCode()
  }, [code, demoCode])

  const [publishProgress, setPublishProgress] = useState<string>("")
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false)

  const onSubmit = async (data: FormData) => {
    console.log("Starting onSubmit with data:", {
      componentSlug: data.component_slug,
      demoCount: data.demos?.length,
      hasCode: !!data.code,
      userId: publishAsUser?.id,
      demoData: data.demos.map((demo) => ({
        hasName: !!demo.name,
        hasDemoCode: !!demo.demo_code,
        hasPreviewImage: !!demo.preview_image_file,
        hasPreviewVideo: !!demo.preview_video_file,
      })),
    })

    setPublishAttemptCount((count) => count + 1)
    setIsSubmitting(true)
    setIsLoadingDialogOpen(true)
    try {
      setPublishProgress("Uploading component files...")
      const baseFolder = `${publishAsUser?.id}/${data.component_slug}`

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

      console.log("Files uploaded successfully:", {
        codeUrl,
        hasTailwindConfig: !!tailwindConfigUrl,
        hasGlobalCss: !!globalCssUrl,
      })

      setPublishProgress("Creating component...")
      const componentData = {
        name: data.name,
        component_names: parsedCode.componentNames,
        component_slug: data.component_slug,
        code: codeUrl,
        tailwind_config_extension: tailwindConfigUrl,
        global_css_extension: globalCssUrl,
        description: data.description ?? null,
        user_id: publishAsUser?.id,
        dependencies: parsedCode.dependencies,
        demo_dependencies: parsedCode.demoDependencies,
        direct_registry_dependencies: data.direct_registry_dependencies,
        preview_url: "",
        video_url: "",
        registry: data.registry,
        license: data.license,
        website_url: data.website_url,
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

      if (!publishAsUser?.id) {
        throw new Error("User ID is required")
      }

      for (const demo of data.demos) {
        const demoIndex = data.demos.indexOf(demo)
        setPublishProgress(
          `Publishing demo ${demoIndex + 1} of ${data.demos.length}...`,
        )

        const demoData: Omit<Tables<"demos">, "id"> = {
          component_id: insertedComponent.id,
          demo_code: "", // Will update after file upload
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
        }

        const { data: insertedDemo, error: demoError } = await client
          .from("demos")
          .insert(demoData)
          .select()
          .single()

        if (demoError) throw demoError

        const demoFolder = `${baseFolder}/${insertedDemo.id}`

        console.log(`Uploading files for demo ${demoIndex + 1}:`, {
          hasDemoCode: !!demo.demo_code,
          hasPreviewImage: !!demo.preview_image_file,
          hasPreviewVideo: !!demo.preview_video_file,
          demoFolder,
        })

        const [demoCodeUrl, previewImageR2Url, videoR2Url] = await Promise.all([
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

        console.log(`Demo ${demoIndex + 1} files uploaded:`, {
          demoCodeUrl,
          hasPreviewImage: !!previewImageR2Url,
          hasPreviewVideo: !!videoR2Url,
        })

        const { error: updateDemoError } = await client
          .from("demos")
          .update({
            demo_code: demoCodeUrl,
            preview_url: previewImageR2Url,
            video_url: videoR2Url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", insertedDemo.id)

        if (updateDemoError) throw updateDemoError

        if (demo.tags?.length) {
          await addTagsToComponent(
            client,
            insertedDemo.id,
            demo.tags.filter((tag) => !!tag.slug) as Tag[],
          )
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

  const handleGoToComponent = () => {
    if (publishAsUser?.username) {
      router.push(`/${publishAsUser.username}/${componentSlug}`)
    }
    setIsSuccessDialogOpen(false)
  }

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

  const { demoCodeTextAreaRef, codeInputRef } = useCodeInputsAutoFocus(
    formStep === "detailedForm",
  )

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

  const isDemoInfoComplete = useCallback(() => {
    const values = form.getValues()
    const currentDemo = values.demos[0]
    return !!(currentDemo?.name && demoCode)
  }, [form, demoCode])

  const handleFileChange = (event: { target: { files: File[] } }) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5 MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const demos = form.getValues("demos")
        if (!demos[0]) return
        const updatedDemo: DemoFormData = {
          ...demos[0],
          name: demos[0].name || "",
          demo_code: demos[0].demo_code || "",
          preview_image_data_url: (e.target?.result as string) || "",
          preview_image_file: file,
          tags: demos[0].tags || [],
        }
        demos[0] = updatedDemo
        form.setValue("demos", demos)
      }
      reader.readAsDataURL(file)
    }
  }

  const isDemoDetailsValid = () => {
    if (!form || formStep !== "demoDetails") return true
    const values = form.getValues()
    const currentDemo = values.demos[currentDemoIndex]
    return !!(
      currentDemo?.name &&
      currentDemo?.tags?.length > 0 &&
      currentDemo?.preview_image_data_url
    )
  }

  const handleAddNewDemo = () => {
    const demos = form.getValues().demos || []
    const newDemoIndex = demos.length

    form.setValue("demos", [
      ...demos,
      {
        name: "",
        demo_code: "",
        tags: [],
        preview_image_data_url: "",
        preview_image_file: new File([], "placeholder"),
        preview_video_data_url: "",
        preview_video_file: new File([], "placeholder"),
        demo_direct_registry_dependencies: [],
      },
    ])

    setCurrentDemoIndex(newDemoIndex)
    setOpenAccordion(`demo-${newDemoIndex}`)
    handleStepChange("demoCode")
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

  const handleDeleteDemo = (index: number) => {
    const demos = form.getValues().demos
    const newDemos = demos.filter((_, i) => i !== index)
    form.setValue("demos", newDemos)
    if (currentDemoIndex >= index) {
      setCurrentDemoIndex(Math.max(0, currentDemoIndex - 1))
    }
  }

  useEffect(() => {
    if (isComponentInfoComplete()) {
      setOpenAccordion("demo-info")
    }
  }, [isComponentInfoComplete])

  useEffect(() => {
    const demos = form.watch("demos")
    const currentDemo = demos[currentDemoIndex]
    if (currentDemo?.demo_code) {
      setOpenAccordion(
        currentDemoIndex === 0 ? "demo-info" : `demo-${currentDemoIndex}`,
      )
    }
  }, [currentDemoIndex, form.watch("demos")])

  const handleAccordionChange = useCallback(
    (value: string | undefined) => {
      console.log("Accordion change:", { value, currentDemoIndex })

      // First update the accordion
      setOpenAccordion(value || "")

      // Then update the demo index after a small delay
      setTimeout(() => {
        if (value === "demo-info") {
          console.log("Setting demo index to 0")
          setCurrentDemoIndex(0)
        } else if (value?.startsWith("demo-")) {
          const index = parseInt(value.replace("demo-", ""))
          if (!isNaN(index)) {
            console.log("Setting demo index to", index)
            setCurrentDemoIndex(index)
          }
        }
      }, 0)

      console.log("New state:", {
        openAccordion: value,
        currentDemoIndex:
          value === "demo-info"
            ? 0
            : value?.startsWith("demo-")
              ? parseInt(value.replace("demo-", ""))
              : currentDemoIndex,
      })
    },
    [setOpenAccordion, setCurrentDemoIndex, currentDemoIndex],
  )

  return (
    <>
      <Form {...form}>
        {formStep === "code" && (
          <div className="flex flex-col h-screen w-full absolute left-0 right-0">
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
              publishProgress={publishProgress}
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
                {isPreviewReady ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full p-8"
                  >
                    <React.Suspense fallback={<LoadingSpinner />}>
                      <PublishComponentPreview
                        code={code}
                        demoCode={demoCode}
                        slugToPublish={componentSlug}
                        registryToPublish={registryToPublish}
                        directRegistryDependencies={[
                          ...directRegistryDependencies,
                          ...demoDirectRegistryDependencies,
                        ]}
                        isDarkTheme={isDarkTheme}
                        customTailwindConfig={customTailwindConfig}
                        customGlobalCss={customGlobalCss}
                        form={form}
                      />
                    </React.Suspense>
                  </motion.div>
                ) : (
                  <div className="h-full p-8">
                    {activeCodeTab === "component" && <CodeGuidelinesAlert />}
                    {activeCodeTab === "tailwind" && (
                      <TailwindGuidelinesAlert />
                    )}
                    {activeCodeTab === "globals" && (
                      <GlobalStylesGuidelinesAlert />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(formStep === "demoCode" || formStep === "demoDetails") && (
          <div className="flex flex-col h-screen w-full absolute left-0 right-0">
            <PublishHeader
              formStep={formStep}
              componentSlug={componentSlug}
              setFormStep={handleStepChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isFormValid={isFormValid(form)}
              form={form}
              publishProgress={publishProgress}
            />
            <div className="flex h-[calc(100vh-3.5rem)]">
              <div className="w-1/2 border-r pointer-events-auto">
                {formStep === "demoCode" ? (
                  <EditorStep
                    form={form}
                    isDarkTheme={isDarkTheme}
                    fieldName={`demos.${currentDemoIndex}.demo_code`}
                    value={demoCode}
                    onChange={(value) => {
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
                    }}
                  />
                ) : (
                  <div className="p-8">
                    <DemoDetailsForm form={form} />
                  </div>
                )}
              </div>
              <div className="w-1/2 pointer-events-auto">
                {isPreviewReady ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full p-8"
                  >
                    <React.Suspense fallback={<LoadingSpinner />}>
                      <PublishComponentPreview
                        code={code}
                        demoCode={demoCode}
                        slugToPublish={componentSlug}
                        registryToPublish={registryToPublish}
                        directRegistryDependencies={[
                          ...directRegistryDependencies,
                          ...demoDirectRegistryDependencies,
                        ]}
                        isDarkTheme={isDarkTheme}
                        customTailwindConfig={customTailwindConfig}
                        customGlobalCss={customGlobalCss}
                        form={form}
                      />
                    </React.Suspense>
                  </motion.div>
                ) : (
                  <div className="p-8">
                    <DemoComponentGuidelinesAlert
                      mainComponentName={
                        parsedCode.componentNames[0] ?? "MyComponent"
                      }
                      componentSlug={componentSlug}
                      registryToPublish={registryToPublish}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {formStep === "nameSlugForm" && (
          <div
            className={cn(
              "flex flex-col scrollbar-hide items-start gap-2 py-8 max-h-[calc(100vh-40px)] px-[2px] overflow-y-auto w-1/3 min-w-[450px]",
            )}
          >
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

        {formStep === "detailedForm" && unknownDependencies?.length === 0 && (
          <div className="flex flex-col h-[100vh] w-full absolute left-0 right-0 overflow-hidden">
            <PublishHeader
              formStep={formStep}
              componentSlug={componentSlug}
              setFormStep={handleStepChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isFormValid={isFormValid(form)}
              form={form}
              publishProgress={publishProgress}
              onAddDemo={handleAddNewDemo}
            />
            <div className="flex gap-8 w-full h-[calc(100vh-3rem)] overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="w-1/3 flex flex-col gap-4 overflow-y-auto p-4"
              >
                <div className="space-y-4 p-[2px]">
                  <Accordion
                    type="single"
                    value={openAccordion}
                    onValueChange={handleAccordionChange}
                    collapsible
                    className="w-full"
                  >
                    <AccordionItem
                      value="component-info"
                      className="bg-background border-none"
                    >
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
                                setActiveCodeTab("tailwind")
                              }}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="demo-info"
                      className="bg-background border-none"
                    >
                      <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-all duration-200 ease-in-out -mx-2 px-2">
                        <div className="flex items-center gap-2">
                          Demo
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1.5 text-xs font-medium",
                              isDemoInfoComplete()
                                ? "border-emerald-500/20"
                                : "border-amber-500/20",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                isDemoInfoComplete()
                                  ? "bg-emerald-500"
                                  : "bg-amber-500",
                              )}
                              aria-hidden="true"
                            />
                            {isDemoInfoComplete() ? "Complete" : "Required"}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        <div className="text-foreground space-y-4">
                          <DemoDetailsForm form={form} />
                          <EditCodeFileCard
                            iconSrc={
                              isDarkTheme
                                ? "/demo-file-dark.svg"
                                : "/demo-file.svg"
                            }
                            mainText="Demo code"
                            subText={`${parsedCode.demoComponentNames.slice(0, 2).join(", ")}${
                              parsedCode.demoComponentNames.length > 2
                                ? ` +${parsedCode.demoComponentNames.length - 2}`
                                : ""
                            }`}
                            onEditClick={() => {
                              handleStepChange("demoCode")
                              setTimeout(() => {
                                demoCodeTextAreaRef.current?.focus()
                              }, 0)
                            }}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {demos?.map(
                      (_, index) =>
                        index > 0 && (
                          <AccordionItem
                            key={index}
                            value={`demo-${index}`}
                            className="bg-background border-none group"
                          >
                            <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-all duration-200 ease-in-out -mx-2 px-2">
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex items-center gap-2 flex-1">
                                  Demo {index + 1}
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "gap-1.5 text-xs font-medium",
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteDemo(index)
                                  }}
                                >
                                  <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <path
                                      d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM3 5.5C3 5.22386 3.22386 5 3.5 5H11.5C11.7761 5 12 5.22386 12 5.5C12 5.77614 11.7761 6 11.5 6H3.5C3.22386 6 3 5.77614 3 5.5ZM3.5 7C3.22386 7 3 7.22386 3 7.5C3 7.77614 3.22386 8 3.5 8H11.5C11.7761 8 12 7.77614 12 7.5C12 7.22386 11.7761 7 11.5 7H3.5ZM3 9.5C3 9.22386 3.22386 9 3.5 9H11.5C11.7761 9 12 9.22386 12 9.5C12 9.77614 11.7761 10 11.5 10H3.5C3.22386 10 3 9.77614 3 9.5Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="text-foreground space-y-4">
                                <DemoDetailsForm form={form} />
                                <EditCodeFileCard
                                  iconSrc={
                                    isDarkTheme
                                      ? "/demo-file-dark.svg"
                                      : "/demo-file.svg"
                                  }
                                  mainText={`Demo ${index + 1} code`}
                                  onEditClick={() => {
                                    handleStepChange("demoCode")
                                    setCurrentDemoIndex(index)
                                  }}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ),
                    )}
                  </Accordion>
                </div>
              </motion.div>

              {isPreviewReady && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-2/3 h-full"
                >
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <PublishComponentPreview
                      code={code}
                      demoCode={demoCode}
                      slugToPublish={componentSlug}
                      registryToPublish={registryToPublish}
                      directRegistryDependencies={[
                        ...directRegistryDependencies,
                        ...demoDirectRegistryDependencies,
                      ]}
                      isDarkTheme={isDarkTheme}
                      customTailwindConfig={customTailwindConfig}
                      customGlobalCss={customGlobalCss}
                      form={form}
                    />
                  </React.Suspense>
                </motion.div>
              )}
            </div>
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
      />
      <LoadingDialog isOpen={isLoadingDialogOpen} message={publishProgress} />
    </>
  )
}
