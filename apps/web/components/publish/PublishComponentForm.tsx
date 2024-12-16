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
import { Textarea } from "@/components/ui/textarea"
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
import { Hotkey } from "../ui/hotkey"
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
import { defaultTailwindConfig, defaultGlobalCss } from "@/lib/sandpack"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ParsedCodeData {
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  directRegistryDependencyImports: string[]
  componentNames: string[]
  demoComponentNames: string[]
}

type FormStep = "nameSlugForm" | "code" | "demoCode" | "customization" | "detailedForm"

export default function PublishComponentForm() {
  const registryToPublish = "ui"
  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const router = useRouter()
  const isDebug = useDebugMode()
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      component_slug: "",
      registry: "ui",
      unknown_dependencies: [],
      direct_registry_dependencies: [],
      demo_direct_registry_dependencies: [],
      code: "",
      demo_code: "",
      description: "",
      tags: [],
      license: "mit",
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

  const [formStep, setFormStep] = useState<FormStep>("nameSlugForm")
  const [parsedCode, setParsedCode] = useState<ParsedCodeData>({
    dependencies: {},
    demoDependencies: {},
    directRegistryDependencyImports: [],
    componentNames: [],
    demoComponentNames: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customTailwindConfig, setCustomTailwindConfig] = useState(
    defaultTailwindConfig,
  )
  const [customGlobalCss, setCustomGlobalCss] = useState(defaultGlobalCss)

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
    setIsSubmitting(true)
    try {
      const codeFileName = `${data.component_slug}.tsx`
      const demoCodeFileName = `${data.component_slug}.demo.tsx`

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToR2({
          file: {
            name: codeFileName,
            type: "text/plain",
            textContent: data.code,
          },
          fileKey: `${user?.id!}/${codeFileName}`,
          bucketName: "components-code",
        }),
        uploadToR2({
          file: {
            name: demoCodeFileName,
            type: "text/plain",
            textContent: demoCode,
          },
          fileKey: `${user?.id!}/${demoCodeFileName}`,
          bucketName: "components-code",
        }),
      ])
      if (!codeUrl || !demoCodeUrl) {
        throw new Error("Failed to upload code files to R2")
      }

      let previewImageR2Url = ""
      if (data.preview_image_file) {
        const fileExtension = data.preview_image_file.name.split(".").pop()
        const fileKey = `${user?.id!}/${componentSlug}.${fileExtension}`
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

      const componentData = {
        name: data.name,
        component_names: parsedCode.componentNames,
        component_slug: data.component_slug,
        code: codeUrl,
        demo_code: demoCodeUrl,
        description: data.description ?? null,
        user_id: user?.id!,
        dependencies: parsedCode.dependencies,
        demo_dependencies: parsedCode.demoDependencies,
        direct_registry_dependencies: data.direct_registry_dependencies,
        demo_direct_registry_dependencies:
          data.demo_direct_registry_dependencies,
        preview_url: previewImageR2Url,
        registry: data.registry,
        license: data.license,
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
    } catch (error) {
      console.error("Error adding component:", error)
      const errorMessage = `An error occurred while adding the component${error instanceof Error ? `: ${error.message}` : ""}`
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoToComponent = () => {
    if (user) {
      router.push(`/${user.username}/${componentSlug}`)
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
                  "flex flex-col scrollbar-hide items-start gap-2 py-6 max-h-[calc(100vh-40px)] px-[2px] overflow-y-auto w-1/3 min-w-[450px]",
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
                    <NameSlugForm
                      form={form}
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
                              <Textarea
                                ref={codeInputRef}
                                placeholder="Paste code of your component here"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.value)
                                }}
                                className={cn(
                                  "h-full w-full flex-grow resize-none scrollbar-hide",
                                )}
                              />
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="absolute bottom-2 right-2 z-2 h-[36px]">
                      <Button
                        size="sm"
                        disabled={
                          !code?.length || !parsedCode.componentNames?.length
                        }
                        onClick={() => setFormStep("demoCode")}
                      >
                        Continue
                      </Button>
                    </div>
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
                                <Textarea
                                  placeholder="Paste code that demonstrates usage of the component with all variants"
                                  ref={demoCodeTextAreaRef}
                                  value={field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.value)
                                  }}
                                  className="w-full h-full resize-none"
                                  style={{
                                    height: "100%",
                                    minHeight: "100%",
                                  }}
                                />
                              </motion.div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="absolute bottom-2 right-2 z-2 h-[36px]">
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
                      <h3 className="text-lg font-semibold">Customize Styling</h3>
                      <p className="text-sm text-muted-foreground">
                        Optionally customize the Tailwind configuration and CSS variables for your component.
                      </p>
                      
                      <Tabs defaultValue="tailwind" className="w-full">
                        <TabsList>
                          <TabsTrigger value="tailwind">Tailwind Config</TabsTrigger>
                          <TabsTrigger value="css">Global CSS</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="tailwind">
                          <div className="flex flex-col gap-2">
                            <Label>Tailwind Configuration</Label>
                            <ScrollArea className="h-[400px] w-full rounded-md border">
                              <Textarea
                                value={customTailwindConfig}
                                onChange={(e) => setCustomTailwindConfig(e.target.value)}
                                className="font-mono text-sm h-full"
                                placeholder="Customize your Tailwind config..."
                              />
                            </ScrollArea>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="css">
                          <div className="flex flex-col gap-2">
                            <Label>CSS Variables</Label>
                            <ScrollArea className="h-[400px] w-full rounded-md border">
                              <Textarea
                                value={customGlobalCss}
                                onChange={(e) => setCustomGlobalCss(e.target.value)}
                                className="font-mono text-sm h-full"
                                placeholder=":root { /* Add your CSS variables here */ }"
                              />
                            </ScrollArea>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setFormStep("demoCode")}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setFormStep("detailedForm")}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {formStep === "detailedForm" &&
                  unknownDependencies?.length > 0 && (
                    <ResolveUnknownDependenciesAlertForm
                      unknownDependencies={unknownDependencies}
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
                          isDarkTheme ? "/css-file.svg" : "/css-file.svg"
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
                        mainText="Styling"
                        subText="Tailwind config and global CSS"
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
  // eslint-disable-next-line no-unused-vars
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
            <Hotkey keys={["N"]} variant="outline" />
          </Button>
          <Button onClick={onGoToComponent} variant="default">
            View Component
            <Hotkey keys={["⏎"]} modifier={true} variant="outline" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
