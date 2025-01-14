"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { uploadToR2 } from "@/lib/r2"
import { formSchema, FormData, isFormValid } from "./utils"
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
  ResolveUnknownDependenciesAlertForm,
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

  const [formStartTime] = useState(() => Date.now())
  const [publishAttemptCount, setPublishAttemptCount] = useState(0)
  const [completedSteps] = useState<string[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      component_slug: "",
      registry: "ui",
      publish_as_username: user?.username ?? undefined,
      unknown_dependencies: [],
      direct_registry_dependencies: [],
      demo_direct_registry_dependencies: [],
      code: "",
      demo_code: "",
      demo_name: "",
      description: "",
      tags: [],
      license: "mit",
      website_url: "",
    },
  })
  const {
    component_slug: componentSlug,
    code,
    demo_code: demoCode,
    tags: validTags,
  } = form.getValues()
  const unknownDependencies = form.watch("unknown_dependencies")
  const directRegistryDependencies = form.watch("direct_registry_dependencies")
  const demoDirectRegistryDependencies = form.watch(
    "demo_direct_registry_dependencies",
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

        form.setValue("unknown_dependencies", parsedUnknownDependencies)
      } catch (error) {
        console.error("Error parsing dependencies from code:", error)
      }
    }

    parseDependenciesFromCode()
  }, [code, demoCode])

  const onSubmit = async (data: FormData) => {
    setPublishAttemptCount((count) => count + 1)
    setIsSubmitting(true)
    try {
      const baseFolder = `${publishAsUser?.id}/${data.component_slug}`

      // Загружаем основные файлы компонента
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

      const componentData = {
        name: data.name,
        component_names: parsedCode.componentNames,
        component_slug: data.component_slug,
        code: codeUrl,
        demo_code: "",
        tailwind_config_extension: tailwindConfigUrl,
        global_css_extension: globalCssUrl,
        description: data.description ?? null,
        user_id: publishAsUser?.id,
        dependencies: parsedCode.dependencies,
        demo_dependencies: parsedCode.demoDependencies,
        direct_registry_dependencies: data.direct_registry_dependencies,
        demo_direct_registry_dependencies:
          data.demo_direct_registry_dependencies,
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

      if (error) throw error
      // Create initial demo record in database
      const demoData: Omit<Tables<"demos">, "id"> = {
        component_id: insertedComponent.id,
        demo_code: "", // Will update after file upload
        demo_dependencies: parsedCode.demoDependencies,
        demo_direct_registry_dependencies:
          data.demo_direct_registry_dependencies,
        preview_url: "",
        video_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        compiled_css: null,
        pro_preview_image_url: null,
        name: data.demo_name,
      }

      const { data: insertedDemo, error: demoError } = await client
        .from("demos")
        .insert(demoData)
        .select()
        .single()

      if (demoError) throw demoError

      // Теперь используем ID из базы данных для создания папки
      const demoFolder = `${baseFolder}/${insertedDemo.id}`

      // Загружаем файлы демо
      const [demoCodeUrl, previewImageR2Url, videoR2Url] = await Promise.all([
        uploadToR2({
          file: {
            name: "code.demo.tsx",
            type: "text/plain",
            textContent: demoCode,
          },
          fileKey: `${demoFolder}/code.demo.tsx`,
          bucketName: "components-code",
        }),
        data.preview_image_file
          ? uploadToR2({
              file: {
                name: "preview.png",
                type: data.preview_image_file.type,
                encodedContent: Buffer.from(
                  await data.preview_image_file.arrayBuffer(),
                ).toString("base64"),
              },
              fileKey: `${demoFolder}/preview.png`,
              bucketName: "components-code",
              contentType: data.preview_image_file.type,
            })
          : Promise.resolve(null),
        data.preview_video_file
          ? uploadToR2({
              file: {
                name: "video.mp4",
                type: "video/mp4",
                encodedContent: Buffer.from(
                  await data.preview_video_file.arrayBuffer(),
                ).toString("base64"),
              },
              fileKey: `${demoFolder}/video.mp4`,
              bucketName: "components-code",
              contentType: "video/mp4",
            })
          : Promise.resolve(null),
      ])

      // Обновляем запись демо с URL-ами файлов
      const { error: updateError } = await client
        .from("demos")
        .update({
          demo_code: demoCodeUrl,
          preview_url: previewImageR2Url,
          video_url: videoR2Url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", insertedDemo.id)

      if (updateError) throw updateError

      if (validTags) {
        await addTagsToComponent(
          client,
          insertedDemo.id,
          validTags.filter((tag) => !!tag.slug) as Tag[],
        )
      }

      setIsSuccessDialogOpen(true)
      trackEvent(AMPLITUDE_EVENTS.PUBLISH_COMPONENT, {
        componentName: data.name,
        componentSlug: data.component_slug,
        userId: user?.id,
        hasDemo: true,
        tagsCount: data.tags?.length || 0,
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
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    onSubmit(formData)
  }

  const isPreviewReady =
    unknownDependencies?.length === 0 && !!code.length && !!demoCode.length

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
    const { demo_name } = form.getValues()
    return !!demo_name && !!demoCode
  }, [form, demoCode])

  const [openAccordion, setOpenAccordion] = useState<string | undefined>(
    "component-info",
  )

  useEffect(() => {
    if (isComponentInfoComplete()) {
      setOpenAccordion("demo-info")
    }
  }, [isComponentInfoComplete])

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
            />
            <div className="flex h-[calc(100vh-3.5rem)]">
              <div className="w-1/2 border-r pointer-events-auto">
                {formStep === "demoCode" ? (
                  <EditorStep
                    form={form}
                    isDarkTheme={isDarkTheme}
                    fieldName="demo_code"
                    value={demoCode}
                    onChange={(value) => form.setValue("demo_code", value)}
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

        {formStep === "detailedForm" && unknownDependencies?.length > 0 && (
          <ResolveUnknownDependenciesAlertForm
            unknownDependencies={unknownDependencies}
            onBack={() => handleStepChange("demoCode")}
            onDependenciesResolved={(resolvedDependencies) => {
              form.setValue(
                "unknown_dependencies",
                unknownDependencies.filter(
                  (dependency) =>
                    !resolvedDependencies
                      .map((d) => d.slug)
                      .includes(dependency.slugWithUsername),
                ),
              )
              form.setValue("direct_registry_dependencies", [
                ...new Set([
                  ...form.getValues("direct_registry_dependencies"),
                  ...resolvedDependencies
                    .filter((d) => !d.isDemoDependency)
                    .map((d) => `${d.username}/${d.slug}`),
                ]),
              ])
              form.setValue("demo_direct_registry_dependencies", [
                ...new Set([
                  ...form.getValues("demo_direct_registry_dependencies"),
                  ...resolvedDependencies
                    .filter((d) => d.isDemoDependency)
                    .map((d) => `${d.username}/${d.slug}`),
                ]),
              ])
            }}
          />
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
                    onValueChange={setOpenAccordion}
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
                  </Accordion>

                  <Accordion
                    type="single"
                    value={openAccordion}
                    onValueChange={setOpenAccordion}
                    collapsible
                    className="w-full"
                  >
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
                            subText={`${parsedCode.demoComponentNames.slice(0, 2).join(", ")}${parsedCode.demoComponentNames.length > 2 ? ` +${parsedCode.demoComponentNames.length - 2}` : ""}`}
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
          unknownDependencies={unknownDependencies}
        />
      )}
      <SuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onAddAnother={handleAddAnother}
        onGoToComponent={handleGoToComponent}
      />
    </>
  )
}
