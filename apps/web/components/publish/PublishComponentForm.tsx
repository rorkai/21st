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
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { addTagsToComponent } from "@/lib/queries"
import { ComponentDetailsForm, NameSlugForm } from "./ComponentDetailsForm"
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
import { useSuccessDialogHotkeys } from "./hotkeys"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { usePublishAs } from "./use-publish-as"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog"
import { ChevronLeftIcon } from "lucide-react"
import { Editor } from "@monaco-editor/react"

export interface ParsedCodeData {
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  directRegistryDependencyImports: string[]
  componentNames: string[]
  demoComponentNames: string[]
}

type FormStep =
  | "nameSlugForm"
  | "code"
  | "demoCode"
  | "customization"
  | "detailedForm"

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
          directRegistryDependencyImports,
        })

        const ambigiousRegistryDependencies = Object.values(
          extractAmbigiousRegistryDependencies(code),
        )
        const ambigiousDemoDirectRegistryDependencies = Object.values(
          extractAmbigiousRegistryDependencies(demoCode),
        )

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

  return (
    <>
      <Form {...form}>
        <div className="flex w-full h-full items-center justify-center">
          <AnimatePresence>
            <div className={`flex gap-4 items-center h-full w-full mt-2`}>
              <div
                className={cn(
                  "flex flex-col scrollbar-hide items-start gap-2 py-8 max-h-[calc(100vh-40px)] px-[2px] overflow-y-auto w-1/3 min-w-[450px]",
                )}
              >
                {formStep === "nameSlugForm" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col justify-center w-full"
                  >
                    <h2 className="text-3xl font-bold mb-4">
                      Publish your component
                    </h2>
                    {isAdmin && (
                      <div className="flex flex-col gap-2 mb-4">
                        <Label
                          htmlFor="publish-as"
                          className="block text-sm font-medium"
                        >
                          Publish as (admin only)
                        </Label>
                        <Input
                          id="publish-as"
                          placeholder="Enter username"
                          value={publishAsUsername}
                          onChange={(e) =>
                            form.setValue("publish_as_username", e.target.value)
                          }
                        />
                      </div>
                    )}
                    <NameSlugForm
                      form={form}
                      publishAsUserId={publishAsUser?.id}
                      isSlugReadOnly={false}
                      placeholderName={"Button"}
                    />
                    <Button
                      className="mt-4"
                      disabled={
                        !form.watch("name") || !form.watch("slug_available")
                      }
                      size="lg"
                      onClick={() => setFormStep("code")}
                    >
                      Continue
                    </Button>
                  </motion.div>
                )}
                {formStep === "code" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="w-full"
                  >
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem className="h-full w-full">
                          <Label>Component code</Label>
                          <FormControl>
                            <motion.div
                              className="flex flex-col relative w-full"
                              animate={{
                                height: "70vh",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Editor
                                defaultLanguage="typescript"
                                defaultValue={field.value}
                                onChange={(value) =>
                                  field.onChange(value || "")
                                }
                                theme={
                                  isDarkTheme ? "github-dark" : "github-light"
                                }
                                options={{
                                  minimap: { enabled: false },
                                  scrollBeyondLastLine: false,
                                  fontSize: 14,
                                  lineNumbers: "off",
                                  folding: true,
                                  wordWrap: "on",
                                  automaticLayout: true,
                                  padding: { top: 16, bottom: 16 },
                                  scrollbar: {
                                    vertical: "visible",
                                    horizontal: "visible",
                                    verticalScrollbarSize: 8,
                                    horizontalScrollbarSize: 8,
                                    useShadows: false,
                                  },
                                  overviewRulerLanes: 0,
                                  hideCursorInOverviewRuler: true,
                                  overviewRulerBorder: false,
                                  renderLineHighlight: "none",
                                  contextmenu: false,
                                  formatOnPaste: false,
                                  formatOnType: false,
                                  quickSuggestions: false,
                                  suggest: {
                                    showKeywords: false,
                                    showSnippets: false,
                                  },
                                  renderValidationDecorations: "off",
                                  hover: { enabled: false },
                                  inlayHints: { enabled: "off" },
                                  occurrencesHighlight: "off",
                                  selectionHighlight: false,
                                }}
                                beforeMount={(monaco) => {
                                  monaco.editor.defineTheme("github-dark", {
                                    base: "vs-dark",
                                    inherit: true,
                                    rules: [],
                                    colors: {
                                      "editor.background": "#00000000",
                                      "editor.foreground": "#c9d1d9",
                                      "editor.lineHighlightBackground":
                                        "#161b22",
                                      "editorLineNumber.foreground": "#6e7681",
                                      "editor.selectionBackground": "#163356",
                                      "scrollbarSlider.background": "#24292f40",
                                      "scrollbarSlider.hoverBackground":
                                        "#32383f60",
                                      "scrollbarSlider.activeBackground":
                                        "#424a5380",
                                    },
                                  })

                                  monaco.editor.defineTheme("github-light", {
                                    base: "vs",
                                    inherit: true,
                                    rules: [],
                                    colors: {
                                      "editor.background": "#00000000",
                                      "editor.foreground": "#24292f",
                                      "editor.lineHighlightBackground":
                                        "#f6f8fa",
                                      "editorLineNumber.foreground": "#8c959f",
                                      "editor.selectionBackground": "#b6e3ff",
                                      "scrollbarSlider.background": "#24292f20",
                                      "scrollbarSlider.hoverBackground":
                                        "#32383f30",
                                      "scrollbarSlider.activeBackground":
                                        "#424a5340",
                                    },
                                  })
                                }}
                                className={cn(
                                  "h-full w-full flex-grow rounded-md overflow-hidden",
                                  "border border-input focus-within:ring-1 focus-within:ring-ring",
                                )}
                              />
                              <div className="absolute flex gap-2 bottom-2 right-2 z-50 h-[36px]">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => setFormStep("nameSlugForm")}
                                >
                                  <ChevronLeftIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={
                                    !code?.length ||
                                    !parsedCode.componentNames?.length
                                  }
                                  onClick={() => setFormStep("demoCode")}
                                >
                                  Continue
                                </Button>
                              </div>
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
                {formStep === "demoCode" && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="w-full"
                    >
                      <FormField
                        control={form.control}
                        name="demo_code"
                        render={({ field }) => (
                          <FormItem className="w-full relative">
                            <Label>Demo code</Label>
                            <FormControl>
                              <motion.div
                                className="relative"
                                animate={{
                                  height: "70vh",
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <Editor
                                  defaultLanguage="typescript"
                                  defaultValue={field.value}
                                  onChange={(value) =>
                                    field.onChange(value || "")
                                  }
                                  theme={
                                    isDarkTheme ? "github-dark" : "github-light"
                                  }
                                  options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 14,
                                    lineNumbers: "off",
                                    folding: true,
                                    wordWrap: "on",
                                    automaticLayout: true,
                                    padding: { top: 16, bottom: 16 },
                                    scrollbar: {
                                      vertical: "visible",
                                      horizontal: "visible",
                                      verticalScrollbarSize: 8,
                                      horizontalScrollbarSize: 8,
                                      useShadows: false,
                                    },
                                    overviewRulerLanes: 0,
                                    hideCursorInOverviewRuler: true,
                                    overviewRulerBorder: false,
                                    renderLineHighlight: "none",
                                    contextmenu: false,
                                    formatOnPaste: false,
                                    formatOnType: false,
                                    quickSuggestions: false,
                                    suggest: {
                                      showKeywords: false,
                                      showSnippets: false,
                                    },
                                    renderValidationDecorations: "off",
                                    hover: { enabled: false },
                                    inlayHints: { enabled: "off" },
                                    occurrencesHighlight: "off",
                                    selectionHighlight: false,
                                  }}
                                  beforeMount={(monaco) => {
                                    monaco.editor.defineTheme("github-dark", {
                                      base: "vs-dark",
                                      inherit: true,
                                      rules: [],
                                      colors: {
                                        "editor.background": "#00000000",
                                        "editor.foreground": "#c9d1d9",
                                        "editor.lineHighlightBackground":
                                          "#161b22",
                                        "editorLineNumber.foreground":
                                          "#6e7681",
                                        "editor.selectionBackground": "#163356",
                                        "scrollbarSlider.background":
                                          "#24292f40",
                                        "scrollbarSlider.hoverBackground":
                                          "#32383f60",
                                        "scrollbarSlider.activeBackground":
                                          "#424a5380",
                                      },
                                    })

                                    monaco.editor.defineTheme("github-light", {
                                      base: "vs",
                                      inherit: true,
                                      rules: [],
                                      colors: {
                                        "editor.background": "#00000000",
                                        "editor.foreground": "#24292f",
                                        "editor.lineHighlightBackground":
                                          "#f6f8fa",
                                        "editorLineNumber.foreground":
                                          "#8c959f",
                                        "editor.selectionBackground": "#b6e3ff",
                                        "scrollbarSlider.background":
                                          "#24292f20",
                                        "scrollbarSlider.hoverBackground":
                                          "#32383f30",
                                        "scrollbarSlider.activeBackground":
                                          "#424a5340",
                                      },
                                    })
                                  }}
                                  className={cn(
                                    "h-full w-full flex-grow rounded-md overflow-hidden",
                                    "border border-input focus-within:ring-1 focus-within:ring-ring",
                                  )}
                                />
                                <div className="absolute flex gap-2 bottom-2 right-2 z-50 h-[36px]">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => setFormStep("code")}
                                  >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={
                                      !demoCode?.length ||
                                      !parsedCode.demoComponentNames?.length
                                    }
                                    onClick={() => setFormStep("customization")}
                                  >
                                    Continue
                                  </Button>
                                </div>
                              </motion.div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  </>
                )}

                {formStep === "customization" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <div className="flex flex-col gap-4">
                      <h2 className="text-3xl font-bold mt-10">
                        Tailwind styles (optional)
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Optionally extend shadcn/ui Tailwind theme to customize
                        your component
                      </p>

                      <Tabs defaultValue="tailwind" className="w-full">
                        <TabsList className="rounded-lg h-9">
                          <TabsTrigger value="tailwind">
                            tailwind.config.js
                          </TabsTrigger>
                          <TabsTrigger value="css">globals.css</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tailwind">
                          <div className="relative flex flex-col gap-2">
                            <Editor
                              defaultLanguage="javascript"
                              value={customTailwindConfig}
                              onChange={(value) =>
                                setCustomTailwindConfig(value || "")
                              }
                              theme={
                                isDarkTheme ? "github-dark" : "github-light"
                              }
                              options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                lineNumbers: "off",
                                folding: true,
                                wordWrap: "on",
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                scrollbar: {
                                  vertical: "visible",
                                  horizontal: "visible",
                                  verticalScrollbarSize: 8,
                                  horizontalScrollbarSize: 8,
                                  useShadows: false,
                                },
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                                renderLineHighlight: "none",
                                contextmenu: false,
                                formatOnPaste: false,
                                formatOnType: false,
                                quickSuggestions: false,
                                suggest: {
                                  showKeywords: false,
                                  showSnippets: false,
                                },
                                renderValidationDecorations: "off",
                                hover: { enabled: false },
                                inlayHints: { enabled: "off" },
                                occurrencesHighlight: "off",
                                selectionHighlight: false,
                              }}
                              className={cn(
                                "h-[500px] w-full rounded-md overflow-hidden",
                                "border border-input focus-within:ring-1 focus-within:ring-ring",
                              )}
                            />
                            <div className="absolute flex gap-2 bottom-2 right-2 z-50 h-[36px]">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setFormStep("demoCode")}
                              >
                                <ChevronLeftIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setFormStep("detailedForm")}
                              >
                                {(customTailwindConfig?.length ?? 0) > 0 ||
                                (customGlobalCss?.length ?? 0) > 0
                                  ? "Continue"
                                  : "Skip"}
                              </Button>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="css">
                          <div className="relative flex flex-col gap-2">
                            <Editor
                              defaultLanguage="css"
                              value={customGlobalCss}
                              onChange={(value) =>
                                setCustomGlobalCss(value || "")
                              }
                              theme={
                                isDarkTheme ? "github-dark" : "github-light"
                              }
                              options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                lineNumbers: "off",
                                folding: true,
                                wordWrap: "on",
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                scrollbar: {
                                  vertical: "visible",
                                  horizontal: "visible",
                                  verticalScrollbarSize: 8,
                                  horizontalScrollbarSize: 8,
                                  useShadows: false,
                                },
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                                renderLineHighlight: "none",
                                contextmenu: false,
                                formatOnPaste: false,
                                formatOnType: false,
                                quickSuggestions: false,
                                suggest: {
                                  showKeywords: false,
                                  showSnippets: false,
                                },
                                renderValidationDecorations: "off",
                                hover: { enabled: false },
                                inlayHints: { enabled: "off" },
                                occurrencesHighlight: "off",
                                selectionHighlight: false,
                              }}
                              className={cn(
                                "h-[500px] w-full rounded-md overflow-hidden",
                                "border border-input focus-within:ring-1 focus-within:ring-ring",
                              )}
                            />
                            <div className="absolute flex gap-2 bottom-2 right-2 z-50 h-[36px]">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setFormStep("demoCode")}
                              >
                                <ChevronLeftIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setFormStep("detailedForm")}
                              >
                                Continue
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </motion.div>
                )}

                {formStep === "detailedForm" &&
                  unknownDependencies?.length > 0 && (
                    <ResolveUnknownDependenciesAlertForm
                      unknownDependencies={unknownDependencies}
                      onBack={() => setFormStep("customization")}
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
                          ...form.getValues("direct_registry_dependencies"),
                          ...resolvedDependencies
                            .filter((d) => !d.isDemoDependency)
                            .map((d) => `${d.username}/${d.slug}`),
                        ])
                        form.setValue("demo_direct_registry_dependencies", [
                          ...form.getValues(
                            "demo_direct_registry_dependencies",
                          ),
                          ...resolvedDependencies
                            .filter((d) => d.isDemoDependency)
                            .map((d) => `${d.username}/${d.slug}`),
                        ])
                      }}
                    />
                  )}

                {formStep === "detailedForm" &&
                  unknownDependencies?.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="w-full flex flex-col gap-4"
                    >
                      <EditCodeFileCard
                        iconSrc={
                          isDarkTheme ? "/tsx-file-dark.svg" : "/tsx-file.svg"
                        }
                        mainText={`${form.getValues("name")} code`}
                        subText={`${parsedCode.componentNames.slice(0, 2).join(", ")}${parsedCode.componentNames.length > 2 ? ` +${parsedCode.componentNames.length - 2}` : ""}`}
                        onEditClick={() => {
                          setFormStep("code")
                          codeInputRef.current?.focus()
                        }}
                      />
                      <EditCodeFileCard
                        iconSrc={
                          isDarkTheme ? "/demo-file-dark.svg" : "/demo-file.svg"
                        }
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
                        iconSrc={
                          isDarkTheme ? "/css-file-dark.svg" : "/css-file.svg"
                        }
                        mainText="Custom styles"
                        subText="Tailwind config and globals.css"
                        onEditClick={() => setFormStep("customization")}
                      />
                      <ComponentDetailsForm
                        isEditMode={false}
                        form={form}
                        handleSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        hotkeysEnabled={!isSuccessDialogOpen}
                      />
                    </motion.div>
                  )}
              </div>

              {formStep === "nameSlugForm" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="w-2/3 h-full px-10 flex items-center"
                >
                  <HeroVideoDialog
                    videoSrc="https://www.youtube.com/embed/NXpSAnmleyE"
                    thumbnailSrc="/tutorial-thumbnail.png"
                    thumbnailAlt="Tutorial: How to publish components"
                    animationStyle="from-right"
                    className="w-full"
                  />
                </motion.div>
              )}

              {formStep === "detailedForm" && isPreviewReady && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 3 }}
                  className="w-2/3 h-full py-4"
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
              {formStep === "code" && <CodeGuidelinesAlert />}
              {formStep === "demoCode" && (
                <DemoComponentGuidelinesAlert
                  mainComponentName={
                    parsedCode.componentNames[0] ?? "MyComponent"
                  }
                  componentSlug={componentSlug}
                  registryToPublish={registryToPublish}
                />
              )}
            </div>
          </AnimatePresence>
        </div>
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

const EditCodeFileCard = ({
  iconSrc,
  mainText,
  subText,
  onEditClick,
}: {
  iconSrc: string
  mainText: string
  subText: string
  onEditClick: () => void
}) => (
  <div className="p-2 border rounded-md bg-background text-foreground bg-opacity-80 backdrop-blur-sm flex items-center justify-start">
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <div className="w-10 h-10 relative mr-2 items-center justify-center">
            <Image
              src={iconSrc}
              width={40}
              height={40}
              alt={`${mainText} File`}
            />
          </div>
          <div className="flex flex-col items-start h-10">
            <p className="font-semibold text-[14px]">{mainText}</p>
            <p className="text-sm text-muted-foreground text-[12px]">
              {subText}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={onEditClick}>
          Edit
        </Button>
      </div>
    </div>
  </div>
)

const useCodeInputsAutoFocus = (showDetailedForm: boolean) => {
  const demoCodeTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const codeInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (showDetailedForm) return

    if (codeInputRef.current) {
      codeInputRef.current?.focus?.()
    } else if (demoCodeTextAreaRef.current) {
      demoCodeTextAreaRef.current?.focus()
    }
  }, [showDetailedForm])

  return { codeInputRef, demoCodeTextAreaRef }
}

const SuccessDialog = ({
  isOpen,
  onOpenChange,
  onAddAnother,
  onGoToComponent,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddAnother: () => void
  onGoToComponent: () => void
}) => {
  useSuccessDialogHotkeys({ isOpen, onAddAnother, onGoToComponent })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Component Added Successfully</DialogTitle>
          <DialogDescription className="break-words">
            Your new component has been successfully added. What would you like
            to do next?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onAddAnother} variant="outline">
            Add Another
            <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border px-1.5 ml-1.5 font-mono text-[11px] font-medium text-muted-foreground">
              N
            </kbd>
          </Button>
          <Button onClick={onGoToComponent} variant="default">
            View Component
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans  text-[11px] text-muted leading-none  opacity-100 flex">
              <span className="text-[11px] leading-none font-sans">
                {navigator?.platform?.toLowerCase()?.includes("mac")
                  ? "⌘"
                  : "Ctrl"}
              </span>
              ⏎
            </kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
