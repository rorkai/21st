"use client"

import React, { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { uploadToR2 } from "@/lib/r2"
import { formSchema, FormData } from "./utils"
import {
  extractComponentNames,
  extractNPMDependencies,
  extractDemoComponentNames,
  extractRegistryDependenciesFromImports,
  extractAmbigiousRegistryDependencies,
} from "../../lib/parsers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { addTagsToComponent } from "@/lib/queries"
import { ComponentDetailsForm } from "./ComponentDetailsForm"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useDebugMode } from "@/hooks/use-debug-mode"
import { Tag } from "@/types/global"
import { PublishComponentPreview } from "./preview"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  CodeGuidelinesAlert,
  DebugInfoDisplay,
  DemoComponentGuidelinesAlert,
  ResolveUnknownDependenciesAlertForm,
} from "./alerts"
import { Tables } from "@/types/supabase"
import { LoadingSpinner } from "../LoadingSpinner"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePublishAs } from "./hooks/use-publish-as"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog"
import { ChevronLeftIcon } from "lucide-react"
import { Editor } from "@monaco-editor/react"
import { NameSlugStep } from "./steps/name-slug-step"
import { EditorStep } from "./steps/editor-step"
import { SuccessDialog } from "./success-dialog"
import { EditCodeFileCard } from "./edit-code-file-card"
import { useCodeInputsAutoFocus } from "./hooks/use-code-inputs-auto-focus"

export interface ParsedCodeData {
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  directRegistryDependencyImports: string[]
  componentNames: string[]
  demoComponentNames: string[]
}

type FormStep = "nameSlugForm" | "code" | "demoCode" | "detailedForm"

export default function PublishComponentForm() {
  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const router = useRouter()
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

  const [formStep, setFormStep] = useState<FormStep>("nameSlugForm")
  const isFirstRender = useRef(true)
  const isNavigatingAway = useRef(false)

  useEffect(() => {
    const message = "You have unsaved changes. Are you sure you want to leave?"

    if (formStep === "nameSlugForm") {
      window.onbeforeunload = null
      window.onpopstate = null
      return
    }

    window.onpopstate = () => {
      if (!isNavigatingAway.current && !window.confirm(message)) {
        window.history.pushState(null, "", window.location.href)
      } else {
        isNavigatingAway.current = true
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
      const codeFileName = `${data.component_slug}.tsx`
      const demoCodeFileName = `${data.component_slug}.demo.tsx`

      const tailwindConfigFileName = `${data.component_slug}.tailwind.config.js`
      const globalCssFileName = `${data.component_slug}.global.css`

      const [codeUrl, demoCodeUrl, tailwindConfigUrl, globalCssUrl] =
        await Promise.all([
          uploadToR2({
            file: {
              name: codeFileName,
              type: "text/plain",
              textContent: data.code,
            },
            fileKey: `${publishAsUser?.id!}/${codeFileName}`,
            bucketName: "components-code",
          }),
          uploadToR2({
            file: {
              name: demoCodeFileName,
              type: "text/plain",
              textContent: demoCode,
            },
            fileKey: `${publishAsUser?.id!}/${demoCodeFileName}`,
            bucketName: "components-code",
          }),
          customTailwindConfig
            ? uploadToR2({
                file: {
                  name: tailwindConfigFileName,
                  type: "text/plain",
                  textContent: customTailwindConfig,
                },
                fileKey: `${publishAsUser?.id!}/${tailwindConfigFileName}`,
                bucketName: "components-code",
              })
            : Promise.resolve(null),
          customGlobalCss
            ? uploadToR2({
                file: {
                  name: globalCssFileName,
                  type: "text/plain",
                  textContent: customGlobalCss,
                },
                fileKey: `${publishAsUser?.id!}/${globalCssFileName}`,
                bucketName: "components-code",
              })
            : Promise.resolve(null),
        ])
      if (!codeUrl || !demoCodeUrl) {
        throw new Error("Failed to upload code files to R2")
      }

      let previewImageR2Url = ""
      if (data.preview_image_file) {
        const fileExtension = data.preview_image_file.name.split(".").pop()
        const fileKey = `${publishAsUser?.id}/${componentSlug}.${fileExtension}`
        const buffer = Buffer.from(await data.preview_image_file.arrayBuffer())
        const base64Content = buffer.toString("base64")
        previewImageR2Url = await uploadToR2({
          file: {
            name: fileKey,
            type: data.preview_image_file.type,
            encodedContent: base64Content,
          },
          fileKey,
          bucketName: "components-code",
          contentType: data.preview_image_file.type,
        })
      }

      let videoR2Url = undefined
      if (data.preview_video_file) {
        const processedVideo = data.preview_video_file
        const fileKey = `${publishAsUser?.id}/${componentSlug}.mp4`
        const buffer = Buffer.from(await processedVideo.arrayBuffer())
        const base64Content = buffer.toString("base64")
        videoR2Url = await uploadToR2({
          file: {
            name: fileKey,
            type: "video/mp4",
            encodedContent: base64Content,
          },
          fileKey,
          bucketName: "components-code",
          contentType: "video/mp4",
        })
      }

      const componentData = {
        name: data.name,
        component_names: parsedCode.componentNames,
        component_slug: data.component_slug,
        code: codeUrl,
        demo_code: demoCodeUrl,
        tailwind_config_extension: tailwindConfigUrl,
        global_css_extension: globalCssUrl,
        description: data.description ?? null,
        user_id: publishAsUser?.id,
        dependencies: parsedCode.dependencies,
        demo_dependencies: parsedCode.demoDependencies,
        direct_registry_dependencies: data.direct_registry_dependencies,
        demo_direct_registry_dependencies:
          data.demo_direct_registry_dependencies,
        preview_url: previewImageR2Url,
        video_url: videoR2Url,
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
        throw error
      }

      if (validTags) {
        await addTagsToComponent(
          client,
          insertedComponent.id,
          validTags.filter((tag) => !!tag.slug) as Tag[],
        )
      }

      if (insertedComponent) {
        setIsSuccessDialogOpen(true)
      }

      trackEvent(AMPLITUDE_EVENTS.PUBLISH_COMPONENT, {
        componentName: data.name,
        componentSlug: data.component_slug,
        userId: user?.id,
        isPublic: data.is_public,
        hasDemo: !!data.demo_code,
        tagsCount: data.tags?.length || 0,
        codeQualityMetrics: {
          linesOfCode: data.code.split("\n").length,
          demoLinesOfCode: data.demo_code?.split("\n").length || 0,
          componentCount: parsedCode.componentNames.length,
          demoComponentCount: parsedCode.demoComponentNames.length,
          dependenciesCount: Object.keys(parsedCode.dependencies).length,
          demoDependenciesCount: Object.keys(parsedCode.demoDependencies)
            .length,
        },
        timeSpentEditing: Date.now() - formStartTime,
        stepsCompleted: ["nameSlug", "code", "demo", "details"].filter((step) =>
          completedSteps.includes(step),
        ),
        publishAttempts: publishAttemptCount,
      })
    } catch (error) {
      console.error("Error adding component:", error)
      const errorMessage = `An error occurred while adding the component${error instanceof Error ? `: ${error.message}` : ""}`
      toast.error(errorMessage)
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

  const [activeCodeTab, setActiveCodeTab] = useState<
    "component" | "tailwind" | "globals"
  >("component")

  const [tailwindConfig, setTailwindConfig] = useState("")
  const [globalsCSS, setGlobalsCSS] = useState("")

  return (
    <>
      <Form {...form}>
        {formStep === "code" && (
          <div className="flex flex-col h-screen w-full absolute left-0 right-0">
            <div className="flex items-center justify-between h-12 border-b bg-background z-50 pointer-events-auto">
              <div className="px-4 flex-1">
                <Tabs
                  value={activeCodeTab}
                  onValueChange={(v) =>
                    setActiveCodeTab(v as typeof activeCodeTab)
                  }
                >
                  <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground">
                    <TabsTrigger
                      value="component"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      {componentSlug}.tsx
                    </TabsTrigger>
                    <TabsTrigger
                      value="tailwind"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      tailwind.config.js
                    </TabsTrigger>
                    <TabsTrigger
                      value="globals"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      globals.css
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex items-center gap-2 px-4">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setFormStep("nameSlugForm")}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => setFormStep("demoCode")}>
                  Continue
                </Button>
              </div>
            </div>

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
                      value={tailwindConfig}
                      onChange={setTailwindConfig}
                      language="javascript"
                    />
                  </div>
                )}
                {activeCodeTab === "globals" && (
                  <div className="h-full">
                    <EditorStep
                      form={form}
                      isDarkTheme={isDarkTheme}
                      fieldName="globals_css"
                      value={globalsCSS}
                      onChange={setGlobalsCSS}
                      language="css"
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
                  <div className="p-8">
                    {activeCodeTab === "component" && <CodeGuidelinesAlert />}
                    {activeCodeTab === "tailwind" && (
                      <div className="prose dark:prose-invert max-w-none">
                        <h2>Tailwind Configuration</h2>
                        <p>
                          Customize your component's appearance by extending the
                          default Tailwind configuration. This is optional but
                          can be useful for specific styling needs.
                        </p>
                      </div>
                    )}
                    {activeCodeTab === "globals" && (
                      <div className="prose dark:prose-invert max-w-none">
                        <h2>Global CSS</h2>
                        <p>
                          Add any global CSS styles that your component needs.
                          This is optional and should be used sparingly.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {formStep === "demoCode" && (
          <div className="flex flex-col h-screen w-full absolute left-0 right-0">
            <div className="flex items-center justify-between px-4 h-14 border-b bg-background z-50 pointer-events-auto">
              <div className="rounded-full w-8 h-8 bg-foreground" />
              <div className="flex-1" />
              <div className="text-center font-medium mr-8">
                {componentSlug}.demo.tsx
              </div>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setFormStep("code")}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => setFormStep("detailedForm")}>
                  Continue
                </Button>
              </div>
            </div>

            <div className="flex h-[calc(100vh-3.5rem)]">
              <div className="w-1/2 border-r pointer-events-auto">
                <EditorStep
                  form={form}
                  isDarkTheme={isDarkTheme}
                  fieldName="demo_code"
                  value={demoCode}
                  onChange={(value) => form.setValue("demo_code", value)}
                />
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
              onContinue={() => setFormStep("code")}
              onPublishAsChange={(username) =>
                form.setValue("publish_as_username", username)
              }
            />
          </div>
        )}

        {formStep === "detailedForm" && unknownDependencies?.length > 0 && (
          <ResolveUnknownDependenciesAlertForm
            unknownDependencies={unknownDependencies}
            onBack={() => setFormStep("demoCode")}
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
          <div className="flex gap-8 w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="w-1/2 flex flex-col gap-4"
            >
              <EditCodeFileCard
                iconSrc={isDarkTheme ? "/tsx-file-dark.svg" : "/tsx-file.svg"}
                mainText={`${form.getValues("name")} code`}
                subText={`${parsedCode.componentNames.slice(0, 2).join(", ")}${parsedCode.componentNames.length > 2 ? ` +${parsedCode.componentNames.length - 2}` : ""}`}
                onEditClick={() => {
                  setFormStep("code")
                  codeInputRef.current?.focus()
                }}
              />
              <EditCodeFileCard
                iconSrc={isDarkTheme ? "/demo-file-dark.svg" : "/demo-file.svg"}
                mainText="Demo code"
                subText={`${parsedCode.demoComponentNames.slice(0, 2).join(", ")}${parsedCode.demoComponentNames.length > 2 ? ` +${parsedCode.demoComponentNames.length - 2}` : ""}`}
                onEditClick={() => {
                  setFormStep("demoCode")
                  setTimeout(() => {
                    demoCodeTextAreaRef.current?.focus()
                  }, 0)
                }}
              />
              <EditCodeFileCard
                iconSrc={isDarkTheme ? "/css-file-dark.svg" : "/css-file.svg"}
                mainText="Custom styles"
                subText="Tailwind config and globals.css"
                onEditClick={() => {
                  setFormStep("code")
                  setActiveCodeTab("tailwind")
                }}
              />
              <ComponentDetailsForm
                isEditMode={false}
                form={form}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                hotkeysEnabled={!isSuccessDialogOpen}
              />
            </motion.div>

            {isPreviewReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-1/2 h-full"
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
